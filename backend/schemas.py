from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# Enums
class UserRole(str, Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    ANNOTATOR = "Annotator"
    REVIEWER = "Reviewer"

class ProjectStatus(str, Enum):
    PENDING = "Pending"
    ACTIVE = "Active"
    COMPLETED = "Completed"
    ON_HOLD = "On Hold"

class ReviewStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None

class User(UserBase):
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Project schemas
class ProjectBase(BaseModel):
    project_name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: ProjectStatus = ProjectStatus.PENDING

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[ProjectStatus] = None

class Project(ProjectBase):
    project_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dataset schemas
class DatasetBase(BaseModel):
    dataset_name: str
    description: Optional[str] = None
    format: str

class DatasetCreate(DatasetBase):
    pass

class Dataset(DatasetBase):
    dataset_id: int
    create_date: datetime
    
    class Config:
        from_attributes = True

# Label schemas
class LabelBase(BaseModel):
    label_name: str
    description: Optional[str] = None
    color_code: Optional[str] = None

class LabelCreate(LabelBase):
    pass

class Label(LabelBase):
    label_id: int
    
    class Config:
        from_attributes = True

# Annotation Task schemas
class AnnotationTaskBase(BaseModel):
    project_id: int
    dataset_id: int
    due_date: Optional[date] = None

class AnnotationTaskCreate(AnnotationTaskBase):
    pass

class AnnotationTask(AnnotationTaskBase):
    task_id: int
    
    class Config:
        from_attributes = True

# Task Assignment schemas
class TaskAssignmentBase(BaseModel):
    task_id: int
    user_id: int  # Match database column name
    due_date: Optional[date] = None

class TaskAssignmentCreate(TaskAssignmentBase):
    assigned_by: Optional[int] = None
    status: Optional[str] = "Pending"

class TaskAssignment(TaskAssignmentBase):
    assignment_id: int
    assign_date: datetime
    task: Optional['AnnotationTask'] = None
    
    class Config:
        from_attributes = True

# Need to update forward references
TaskAssignment.model_rebuild()

# Annotation schemas
class AnnotationBase(BaseModel):
    task_id: int
    content: Optional[str] = None  # JSON string with annotation data

class AnnotationCreate(AnnotationBase):
    user_id: int
    label_ids: List[int] = []  # Labels to associate with this annotation

class AnnotationUpdate(BaseModel):
    content: Optional[str] = None
    label_ids: Optional[List[int]] = None

class Annotation(AnnotationBase):
    annotation_id: int
    user_id: int
    create_date: datetime
    
    class Config:
        from_attributes = True

class AnnotationWithLabels(Annotation):
    labels: List[Label] = []
    
    class Config:
        from_attributes = True

# Review schemas
class ReviewBase(BaseModel):
    annotation_id: int
    feedback: Optional[str] = None
    status: ReviewStatus = ReviewStatus.PENDING
    quality_score: Optional[float] = None

class ReviewCreate(ReviewBase):
    reviewer_id: int

class ReviewUpdate(BaseModel):
    feedback: Optional[str] = None
    status: Optional[ReviewStatus] = None
    quality_score: Optional[float] = None

class Review(ReviewBase):
    review_id: int
    reviewer_id: int
    review_date: datetime
    
    class Config:
        from_attributes = True

# Audit Log schemas
class AuditLogCreate(BaseModel):
    user_id: int
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[str] = None

class AuditLog(BaseModel):
    log_id: int
    user_id: int
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Notification schemas
class NotificationBase(BaseModel):
    user_id: int
    message: str

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    notification_id: int
    created_date: datetime
    is_read: bool
    
    class Config:
        from_attributes = True
