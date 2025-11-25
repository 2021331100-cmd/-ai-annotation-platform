"""
Advanced features for modern data annotation platform
Includes: Active Learning, Version Control, Quality Metrics, Consensus, Export
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Dict, Any, Optional
import models
import json
from datetime import datetime, timedelta
import random
from collections import Counter


class ActiveLearningService:
    """Active Learning - prioritize most valuable samples for annotation"""
    
    @staticmethod
    def get_uncertain_samples(db: Session, project_id: int, limit: int = 10) -> List[Dict]:
        """Get samples with highest uncertainty for annotation priority"""
        # Get tasks with low annotation count or high disagreement
        from sqlalchemy import select
        
        tasks = db.query(models.AnnotationTask).filter(
            models.AnnotationTask.project_id == project_id
        ).all()
        
        uncertain_tasks = []
        for task in tasks:
            # Count annotations
            annotation_count = db.query(models.Annotation).filter(
                models.Annotation.task_id == task.task_id
            ).count()
            
            # Calculate disagreement score
            annotations = db.query(models.Annotation).filter(
                models.Annotation.task_id == task.task_id
            ).all()
            
            if len(annotations) > 1:
                # Check label diversity
                label_counts = Counter()
                for ann in annotations:
                    ann_labels = db.query(models.AnnotationLabel).filter(
                        models.AnnotationLabel.annotation_id == ann.annotation_id
                    ).all()
                    for lbl in ann_labels:
                        label_counts[lbl.label_id] += 1
                
                # Calculate entropy (uncertainty)
                total = sum(label_counts.values())
                entropy = 0
                if total > 0:
                    for count in label_counts.values():
                        p = count / total
                        if p > 0:
                            entropy -= p * (p ** 0.5)  # Simplified entropy
                
                uncertainty_score = entropy + (1.0 / (annotation_count + 1))
            else:
                uncertainty_score = 10.0  # High priority for unannotated
            
            uncertain_tasks.append({
                "task_id": task.task_id,
                "uncertainty_score": uncertainty_score,
                "annotation_count": annotation_count,
                "project_id": project_id
            })
        
        # Sort by uncertainty and return top samples
        uncertain_tasks.sort(key=lambda x: x["uncertainty_score"], reverse=True)
        return uncertain_tasks[:limit]
    
    @staticmethod
    def suggest_next_tasks(db: Session, user_id: int, project_id: int, count: int = 5):
        """AI-powered task recommendation for annotators"""
        uncertain = ActiveLearningService.get_uncertain_samples(db, project_id, count * 2)
        
        # Filter out already assigned tasks
        available = []
        for task in uncertain:
            existing = db.query(models.TaskAssignment).filter(
                and_(
                    models.TaskAssignment.task_id == task["task_id"],
                    models.TaskAssignment.user_id == user_id
                )
            ).first()
            if not existing:
                available.append(task)
        
        return available[:count]


class VersionControlService:
    """Version control for annotations"""
    
    @staticmethod
    def create_version(db: Session, annotation_id: int, user_id: int, content: Any, 
                      label_ids: List[int], change_description: str = ""):
        """Save annotation version history"""
        annotation = db.query(models.Annotation).filter(
            models.Annotation.annotation_id == annotation_id
        ).first()
        
        if not annotation:
            return None
        
        # Create audit log entry as version
        version_data = {
            "annotation_id": annotation_id,
            "content": content,
            "label_ids": label_ids,
            "modified_by": user_id,
            "change_description": change_description,
            "version_timestamp": datetime.utcnow().isoformat()
        }
        
        audit = models.AuditLog(
            user_id=user_id,
            action="annotation_version",
            entity_type="Annotation",
            entity_id=annotation_id,
            details=json.dumps(version_data),
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()
        return version_data
    
    @staticmethod
    def get_version_history(db: Session, annotation_id: int) -> List[Dict]:
        """Get all versions of an annotation"""
        versions = db.query(models.AuditLog).filter(
            and_(
                models.AuditLog.entity_type == "Annotation",
                models.AuditLog.entity_id == annotation_id,
                models.AuditLog.action.in_(["annotation_version", "update_annotation", "create_annotation"])
            )
        ).order_by(models.AuditLog.timestamp.desc()).all()
        
        history = []
        for v in versions:
            try:
                details = json.loads(v.details) if isinstance(v.details, str) else v.details
            except:
                details = {}
            
            history.append({
                "version_id": v.log_id,
                "timestamp": v.timestamp.isoformat(),
                "user_id": v.user_id,
                "action": v.action,
                "details": details
            })
        
        return history
    
    @staticmethod
    def restore_version(db: Session, annotation_id: int, version_id: int, user_id: int):
        """Restore annotation to a previous version"""
        version = db.query(models.AuditLog).filter(
            models.AuditLog.log_id == version_id
        ).first()
        
        if not version:
            return None
        
        annotation = db.query(models.Annotation).filter(
            models.Annotation.annotation_id == annotation_id
        ).first()
        
        if not annotation:
            return None
        
        try:
            details = json.loads(version.details) if isinstance(version.details, str) else version.details
            
            # Restore content
            if "content" in details:
                annotation.content = details["content"]
            
            # Restore labels
            if "label_ids" in details:
                # Remove old labels
                db.query(models.AnnotationLabel).filter(
                    models.AnnotationLabel.annotation_id == annotation_id
                ).delete()
                
                # Add restored labels
                for label_id in details["label_ids"]:
                    ann_label = models.AnnotationLabel(
                        annotation_id=annotation_id,
                        label_id=label_id
                    )
                    db.add(ann_label)
            
            db.commit()
            
            # Log restoration
            VersionControlService.create_version(
                db, annotation_id, user_id, annotation.content,
                details.get("label_ids", []), f"Restored to version {version_id}"
            )
            
            return annotation
        except Exception as e:
            db.rollback()
            return None


class QualityMetricsService:
    """Calculate quality metrics for annotations and annotators"""
    
    @staticmethod
    def calculate_annotator_metrics(db: Session, user_id: int, days: int = 30) -> Dict:
        """Calculate performance metrics for an annotator"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Total annotations
        total_annotations = db.query(models.Annotation).filter(
            and_(
                models.Annotation.user_id == user_id,
                models.Annotation.create_date >= cutoff_date
            )
        ).count()
        
        # Reviewed annotations
        reviewed = db.query(models.Review).join(
            models.Annotation,
            models.Review.annotation_id == models.Annotation.annotation_id
        ).filter(
            and_(
                models.Annotation.user_id == user_id,
                models.Review.review_date >= cutoff_date
            )
        ).all()
        
        # Calculate approval rate
        approved_count = sum(1 for r in reviewed if r.status == "Approved")
        approval_rate = (approved_count / len(reviewed) * 100) if reviewed else 0
        
        # Average quality score
        quality_scores = [r.quality_score for r in reviewed if r.quality_score]
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0
        
        # Productivity (annotations per day)
        annotations_per_day = total_annotations / days if days > 0 else 0
        
        # Consistency score (label agreement in multi-annotator tasks)
        consistency = QualityMetricsService._calculate_consistency(db, user_id, cutoff_date)
        
        return {
            "user_id": user_id,
            "period_days": days,
            "total_annotations": total_annotations,
            "reviewed_count": len(reviewed),
            "approved_count": approved_count,
            "approval_rate": round(approval_rate, 2),
            "average_quality_score": round(avg_quality, 2),
            "annotations_per_day": round(annotations_per_day, 2),
            "consistency_score": round(consistency, 2)
        }
    
    @staticmethod
    def _calculate_consistency(db: Session, user_id: int, cutoff_date: datetime) -> float:
        """Calculate how consistent annotator is with consensus"""
        # Get tasks where user annotated and others also annotated
        user_annotations = db.query(models.Annotation).filter(
            and_(
                models.Annotation.user_id == user_id,
                models.Annotation.create_date >= cutoff_date
            )
        ).all()
        
        agreement_count = 0
        total_comparable = 0
        
        for ann in user_annotations:
            # Get other annotations for same task
            other_annotations = db.query(models.Annotation).filter(
                and_(
                    models.Annotation.task_id == ann.task_id,
                    models.Annotation.user_id != user_id
                )
            ).all()
            
            if not other_annotations:
                continue
            
            total_comparable += 1
            
            # Compare labels
            user_labels = set(al.label_id for al in db.query(models.AnnotationLabel).filter(
                models.AnnotationLabel.annotation_id == ann.annotation_id
            ))
            
            # Check agreement with majority
            for other in other_annotations:
                other_labels = set(al.label_id for al in db.query(models.AnnotationLabel).filter(
                    models.AnnotationLabel.annotation_id == other.annotation_id
                ))
                
                if user_labels == other_labels:
                    agreement_count += 1
                    break
        
        return (agreement_count / total_comparable * 100) if total_comparable > 0 else 100
    
    @staticmethod
    def calculate_project_metrics(db: Session, project_id: int) -> Dict:
        """Calculate overall project quality metrics"""
        tasks = db.query(models.AnnotationTask).filter(
            models.AnnotationTask.project_id == project_id
        ).all()
        
        total_tasks = len(tasks)
        annotated_tasks = 0
        reviewed_tasks = 0
        
        for task in tasks:
            ann_count = db.query(models.Annotation).filter(
                models.Annotation.task_id == task.task_id
            ).count()
            
            if ann_count > 0:
                annotated_tasks += 1
                
                # Check if reviewed
                reviews = db.query(models.Review).join(
                    models.Annotation,
                    models.Review.annotation_id == models.Annotation.annotation_id
                ).filter(
                    models.Annotation.task_id == task.task_id
                ).count()
                
                if reviews > 0:
                    reviewed_tasks += 1
        
        completion_rate = (annotated_tasks / total_tasks * 100) if total_tasks > 0 else 0
        review_rate = (reviewed_tasks / annotated_tasks * 100) if annotated_tasks > 0 else 0
        
        return {
            "project_id": project_id,
            "total_tasks": total_tasks,
            "annotated_tasks": annotated_tasks,
            "reviewed_tasks": reviewed_tasks,
            "completion_rate": round(completion_rate, 2),
            "review_rate": round(review_rate, 2)
        }


class ConsensusService:
    """Handle multi-annotator consensus and agreement"""
    
    @staticmethod
    def calculate_inter_annotator_agreement(db: Session, task_id: int) -> Dict:
        """Calculate agreement between multiple annotators (Cohen's Kappa approximation)"""
        annotations = db.query(models.Annotation).filter(
            models.Annotation.task_id == task_id
        ).all()
        
        if len(annotations) < 2:
            return {"agreement": 0, "annotator_count": len(annotations), "message": "Need at least 2 annotations"}
        
        # Get all label sets
        label_sets = []
        for ann in annotations:
            labels = set(al.label_id for al in db.query(models.AnnotationLabel).filter(
                models.AnnotationLabel.annotation_id == ann.annotation_id
            ))
            label_sets.append(labels)
        
        # Calculate pairwise agreement
        agreements = []
        for i in range(len(label_sets)):
            for j in range(i + 1, len(label_sets)):
                intersection = len(label_sets[i] & label_sets[j])
                union = len(label_sets[i] | label_sets[j])
                if union > 0:
                    agreements.append(intersection / union)
        
        avg_agreement = sum(agreements) / len(agreements) if agreements else 0
        
        return {
            "task_id": task_id,
            "annotator_count": len(annotations),
            "agreement_score": round(avg_agreement * 100, 2),
            "status": "high" if avg_agreement > 0.8 else "medium" if avg_agreement > 0.5 else "low"
        }
    
    @staticmethod
    def get_consensus_labels(db: Session, task_id: int, threshold: float = 0.5) -> List[int]:
        """Get consensus labels based on majority vote"""
        annotations = db.query(models.Annotation).filter(
            models.Annotation.task_id == task_id
        ).all()
        
        if not annotations:
            return []
        
        # Count label occurrences
        label_counts = Counter()
        for ann in annotations:
            labels = db.query(models.AnnotationLabel).filter(
                models.AnnotationLabel.annotation_id == ann.annotation_id
            ).all()
            for lbl in labels:
                label_counts[lbl.label_id] += 1
        
        # Get labels that appear in at least threshold% of annotations
        min_votes = max(1, int(len(annotations) * threshold))
        consensus = [label_id for label_id, count in label_counts.items() if count >= min_votes]
        
        return consensus
    
    @staticmethod
    def create_gold_standard(db: Session, task_id: int, label_ids: List[int], created_by: int):
        """Create gold standard (ground truth) annotation"""
        # Check if gold standard already exists
        existing = db.query(models.Annotation).filter(
            and_(
                models.Annotation.task_id == task_id,
                models.Annotation.content.like('%"is_gold_standard": true%')
            )
        ).first()
        
        if existing:
            return existing
        
        # Create gold standard annotation
        gold_annotation = models.Annotation(
            task_id=task_id,
            user_id=created_by,
            content=json.dumps({
                "is_gold_standard": True,
                "created_at": datetime.utcnow().isoformat(),
                "note": "Gold standard / Ground truth annotation"
            }),
            create_date=datetime.utcnow()
        )
        db.add(gold_annotation)
        db.flush()
        
        # Add labels
        for label_id in label_ids:
            ann_label = models.AnnotationLabel(
                annotation_id=gold_annotation.annotation_id,
                label_id=label_id
            )
            db.add(ann_label)
        
        db.commit()
        return gold_annotation


class ExportService:
    """Export annotations in various formats"""
    
    @staticmethod
    def export_to_coco(db: Session, project_id: int) -> Dict:
        """Export annotations in COCO format (for object detection)"""
        project = db.query(models.Project).filter(
            models.Project.project_id == project_id
        ).first()
        
        tasks = db.query(models.AnnotationTask).filter(
            models.AnnotationTask.project_id == project_id
        ).all()
        
        labels = db.query(models.Label).all()
        
        coco_format = {
            "info": {
                "description": project.project_name if project else "Annotation Export",
                "version": "1.0",
                "year": datetime.utcnow().year,
                "date_created": datetime.utcnow().isoformat()
            },
            "licenses": [],
            "images": [],
            "annotations": [],
            "categories": []
        }
        
        # Add categories (labels)
        for idx, label in enumerate(labels):
            coco_format["categories"].append({
                "id": label.label_id,
                "name": label.label_name,
                "supercategory": "none"
            })
        
        # Add images and annotations
        annotation_id_counter = 1
        for task in tasks:
            coco_format["images"].append({
                "id": task.task_id,
                "file_name": f"task_{task.task_id}",
                "height": 0,
                "width": 0
            })
            
            # Get annotations for this task
            annotations = db.query(models.Annotation).filter(
                models.Annotation.task_id == task.task_id
            ).all()
            
            for ann in annotations:
                ann_labels = db.query(models.AnnotationLabel).filter(
                    models.AnnotationLabel.annotation_id == ann.annotation_id
                ).all()
                
                for ann_label in ann_labels:
                    coco_format["annotations"].append({
                        "id": annotation_id_counter,
                        "image_id": task.task_id,
                        "category_id": ann_label.label_id,
                        "bbox": [0, 0, 0, 0],  # Placeholder
                        "area": 0,
                        "iscrowd": 0
                    })
                    annotation_id_counter += 1
        
        return coco_format
    
    @staticmethod
    def export_to_jsonl(db: Session, project_id: int) -> List[Dict]:
        """Export annotations in JSONL format (for NLP tasks)"""
        tasks = db.query(models.AnnotationTask).filter(
            models.AnnotationTask.project_id == project_id
        ).all()
        
        jsonl_data = []
        for task in tasks:
            annotations = db.query(models.Annotation).filter(
                models.Annotation.task_id == task.task_id
            ).all()
            
            for ann in annotations:
                labels = db.query(models.AnnotationLabel).join(
                    models.Label,
                    models.AnnotationLabel.label_id == models.Label.label_id
                ).filter(
                    models.AnnotationLabel.annotation_id == ann.annotation_id
                ).all()
                
                label_names = [db.query(models.Label).filter(
                    models.Label.label_id == lbl.label_id
                ).first().label_name for lbl in labels]
                
                jsonl_data.append({
                    "task_id": task.task_id,
                    "content": ann.content,
                    "labels": label_names,
                    "annotator_id": ann.user_id,
                    "created_at": ann.create_date.isoformat()
                })
        
        return jsonl_data
    
    @staticmethod
    def export_to_csv(db: Session, project_id: int) -> List[List[str]]:
        """Export annotations in CSV format"""
        tasks = db.query(models.AnnotationTask).filter(
            models.AnnotationTask.project_id == project_id
        ).all()
        
        csv_data = [["task_id", "content", "labels", "annotator_id", "created_at"]]
        
        for task in tasks:
            annotations = db.query(models.Annotation).filter(
                models.Annotation.task_id == task.task_id
            ).all()
            
            for ann in annotations:
                labels = db.query(models.AnnotationLabel).join(
                    models.Label,
                    models.AnnotationLabel.label_id == models.Label.label_id
                ).filter(
                    models.AnnotationLabel.annotation_id == ann.annotation_id
                ).all()
                
                label_names = [db.query(models.Label).filter(
                    models.Label.label_id == lbl.label_id
                ).first().label_name for lbl in labels]
                
                csv_data.append([
                    str(task.task_id),
                    str(ann.content),
                    "|".join(label_names),
                    str(ann.user_id),
                    ann.create_date.isoformat()
                ])
        
        return csv_data
