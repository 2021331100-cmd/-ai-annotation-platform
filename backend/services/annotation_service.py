from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
import json

# Annotation Task functions
def create_annotation_task(db: Session, task: schemas.AnnotationTaskCreate):
    db_task = models.AnnotationTask(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_annotation_task(db: Session, task_id: int):
    return db.query(models.AnnotationTask).filter(models.AnnotationTask.task_id == task_id).first()

def get_annotation_tasks(db: Session, project_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.AnnotationTask)
    if project_id:
        query = query.filter(models.AnnotationTask.project_id == project_id)
    return query.offset(skip).limit(limit).all()

# Task Assignment functions
def create_task_assignment(db: Session, assignment: schemas.TaskAssignmentCreate):
    db_assignment = models.TaskAssignment(**assignment.dict())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    
    # Get task details for notification
    task = get_annotation_task(db, assignment.task_id)
    task_info = f"Task #{assignment.task_id}"
    if task and task.project:
        task_info = f"Task #{assignment.task_id} from project '{task.project.project_name}'"
    
    # Create notification for assigned user
    notification = models.Notification(
        user_id=assignment.user_id,
        message=f"🎯 New task assigned: {task_info}"
    )
    db.add(notification)
    db.commit()
    
    # Log the action
    if assignment.assigned_by:
        log_audit(db, assignment.assigned_by, "ASSIGN_TASK", f"Assigned task {assignment.task_id} to user {assignment.user_id}")
    
    return db_assignment

def get_task_assignments_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    from sqlalchemy.orm import joinedload
    return db.query(models.TaskAssignment).options(
        joinedload(models.TaskAssignment.task).joinedload(models.AnnotationTask.project),
        joinedload(models.TaskAssignment.task).joinedload(models.AnnotationTask.dataset)
    ).filter(
        models.TaskAssignment.user_id == user_id
    ).offset(skip).limit(limit).all()

def get_task_assignments_by_task(db: Session, task_id: int):
    return db.query(models.TaskAssignment).filter(
        models.TaskAssignment.task_id == task_id
    ).all()

def get_assignment_by_task_and_user(db: Session, task_id: int, user_id: int):
    return db.query(models.TaskAssignment).filter(
        models.TaskAssignment.task_id == task_id,
        models.TaskAssignment.user_id == user_id
    ).first()

def delete_task_assignment(db: Session, assignment_id: int):
    assignment = db.query(models.TaskAssignment).filter(
        models.TaskAssignment.assignment_id == assignment_id
    ).first()
    if not assignment:
        return False
    db.delete(assignment)
    db.commit()
    return True

# Annotation functions
def create_annotation(db: Session, annotation: schemas.AnnotationCreate):
    # Create the annotation
    db_annotation = models.Annotation(
        task_id=annotation.task_id,
        user_id=annotation.user_id,
        content=annotation.content
    )
    db.add(db_annotation)
    db.flush()  # Flush to get the annotation_id
    
    # Add labels (many-to-many relationship)
    for label_id in annotation.label_ids:
        annotation_label = models.AnnotationLabel(
            annotation_id=db_annotation.annotation_id,
            label_id=label_id
        )
        db.add(annotation_label)
    
    db.commit()
    db.refresh(db_annotation)
    
    # Log the action
    log_audit(db, annotation.user_id, "CREATE_ANNOTATION", f"Created annotation {db_annotation.annotation_id}")
    
    return db_annotation

def get_annotation(db: Session, annotation_id: int):
    return db.query(models.Annotation).filter(models.Annotation.annotation_id == annotation_id).first()

def get_annotations_by_task(db: Session, task_id: int):
    return db.query(models.Annotation).filter(models.Annotation.task_id == task_id).all()

def get_annotations_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Annotation).filter(
        models.Annotation.user_id == user_id
    ).offset(skip).limit(limit).all()

def update_annotation(db: Session, annotation_id: int, annotation_update: schemas.AnnotationUpdate, user_id: int):
    db_annotation = get_annotation(db, annotation_id)
    if not db_annotation:
        return None
    
    # Update content if provided
    if annotation_update.content is not None:
        db_annotation.content = annotation_update.content
    
    # Update labels if provided
    if annotation_update.label_ids is not None:
        # Remove existing labels
        db.query(models.AnnotationLabel).filter(
            models.AnnotationLabel.annotation_id == annotation_id
        ).delete()
        
        # Add new labels
        for label_id in annotation_update.label_ids:
            annotation_label = models.AnnotationLabel(
                annotation_id=annotation_id,
                label_id=label_id
            )
            db.add(annotation_label)
    
    db.commit()
    db.refresh(db_annotation)
    
    # Log the action
    log_audit(db, user_id, "UPDATE_ANNOTATION", f"Updated annotation {annotation_id}")
    
    return db_annotation

def delete_annotation(db: Session, annotation_id: int, user_id: int):
    db_annotation = get_annotation(db, annotation_id)
    if not db_annotation:
        return False
    
    db.delete(db_annotation)
    db.commit()
    
    # Log the action
    log_audit(db, user_id, "DELETE_ANNOTATION", f"Deleted annotation {annotation_id}")
    
    return True

# Review functions
def create_review(db: Session, review: schemas.ReviewCreate):
    db_review = models.Review(**review.dict())
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    # Notify the annotation creator
    annotation = get_annotation(db, review.annotation_id)
    if annotation:
        notification = models.Notification(
            user_id=annotation.user_id,
            message=f"Your annotation #{review.annotation_id} has been reviewed: {review.status.value}"
        )
        db.add(notification)
        db.commit()
    
    # Log the action
    log_audit(db, review.reviewer_id, "CREATE_REVIEW", f"Reviewed annotation {review.annotation_id}")
    
    return db_review

def get_reviews_by_annotation(db: Session, annotation_id: int):
    return db.query(models.Review).filter(models.Review.annotation_id == annotation_id).all()

def get_reviews_by_reviewer(db: Session, reviewer_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Review).filter(
        models.Review.reviewer_id == reviewer_id
    ).offset(skip).limit(limit).all()

def update_review(db: Session, review_id: int, review_update: schemas.ReviewUpdate):
    db_review = db.query(models.Review).filter(models.Review.review_id == review_id).first()
    if not db_review:
        return None
    
    update_data = review_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_review, key, value)
    
    db.commit()
    db.refresh(db_review)
    return db_review

# Audit Log function
def log_audit(db: Session, user_id: int, action: str, details: Optional[str] = None):
    audit_log = models.AuditLog(
        user_id=user_id,
        action=action,
        details=details
    )
    db.add(audit_log)
    db.commit()

def get_audit_logs(db: Session, user_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.AuditLog)
    if user_id:
        query = query.filter(models.AuditLog.user_id == user_id)
    return query.order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

# Notification functions
def create_notification(db: Session, notification: schemas.NotificationCreate):
    db_notification = models.Notification(**notification.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def get_user_notifications(db: Session, user_id: int, unread_only: bool = False):
    query = db.query(models.Notification).filter(models.Notification.user_id == user_id)
    if unread_only:
        query = query.filter(models.Notification.is_read == False)
    return query.order_by(models.Notification.created_date.desc()).all()

def mark_notification_read(db: Session, notification_id: int):
    notification = db.query(models.Notification).filter(
        models.Notification.notification_id == notification_id
    ).first()
    if notification:
        notification.is_read = True
        db.commit()
        return True
    return False
