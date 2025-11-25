from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, JSON, Date, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, date
from database import Base
import enum

# Enums
class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    ANNOTATOR = "Annotator"
    REVIEWER = "Reviewer"

class ProjectStatus(str, enum.Enum):
    PENDING = "Pending"
    ACTIVE = "Active"
    COMPLETED = "Completed"
    ON_HOLD = "On Hold"

class ReviewStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class User(Base):
    __tablename__ = "Users"
    
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships - specify foreign_keys to avoid ambiguity
    task_assignments = relationship("TaskAssignment", back_populates="user", foreign_keys="TaskAssignment.user_id")
    assigned_tasks = relationship("TaskAssignment", foreign_keys="TaskAssignment.assigned_by")
    annotations = relationship("Annotation", back_populates="user")
    reviews = relationship("Review", back_populates="reviewer", foreign_keys="Review.reviewer_id")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Project(Base):
    __tablename__ = "Project"
    
    project_id = Column(Integer, primary_key=True, autoincrement=True)
    project_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    annotation_tasks = relationship("AnnotationTask", back_populates="project", cascade="all, delete-orphan")

class Dataset(Base):
    __tablename__ = "Dataset"
    
    dataset_id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    create_date = Column(DateTime, default=datetime.utcnow)
    format = Column(String(50), nullable=False)
    
    # Relationships
    annotation_tasks = relationship("AnnotationTask", back_populates="dataset", cascade="all, delete-orphan")

class Label(Base):
    __tablename__ = "Label"
    
    label_id = Column(Integer, primary_key=True, autoincrement=True)
    label_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    color_code = Column(String(20), nullable=True)
    
    # Relationships
    annotation_labels = relationship("AnnotationLabel", back_populates="label")

class AnnotationTask(Base):
    __tablename__ = "Annotation_Task"
    
    task_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("Project.project_id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("Dataset.dataset_id", ondelete="CASCADE"), nullable=False)
    due_date = Column(Date, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="annotation_tasks")
    dataset = relationship("Dataset", back_populates="annotation_tasks")
    task_assignments = relationship("TaskAssignment", back_populates="task", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="task", cascade="all, delete-orphan")

class TaskAssignment(Base):
    __tablename__ = "Task_Assignment"
    
    assignment_id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("Annotation_Task.task_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("Users.user_id", ondelete="CASCADE"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("Users.user_id", ondelete="SET NULL"), nullable=True)
    assign_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(Date, nullable=True)
    status = Column(String(50), default="Pending")
    
    # Relationships - explicitly specify foreign_keys to resolve ambiguity
    task = relationship("AnnotationTask", back_populates="task_assignments")
    user = relationship("User", back_populates="task_assignments", foreign_keys=[user_id])
    assigner = relationship("User", foreign_keys=[assigned_by])

class Annotation(Base):
    __tablename__ = "Annotation"
    
    annotation_id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("Annotation_Task.task_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("Users.user_id", ondelete="CASCADE"), nullable=False)
    create_date = Column(DateTime, default=datetime.utcnow)
    content = Column(Text, nullable=True)  # JSON content with annotation data
    
    # Relationships
    task = relationship("AnnotationTask", back_populates="annotations")
    user = relationship("User", back_populates="annotations")
    annotation_labels = relationship("AnnotationLabel", back_populates="annotation", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="annotation", cascade="all, delete-orphan")

class AnnotationLabel(Base):
    __tablename__ = "Annotation_Label"
    
    annotation_id = Column(Integer, ForeignKey("Annotation.annotation_id", ondelete="CASCADE"), primary_key=True)
    label_id = Column(Integer, ForeignKey("Label.label_id", ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    annotation = relationship("Annotation", back_populates="annotation_labels")
    label = relationship("Label", back_populates="annotation_labels")

class Review(Base):
    __tablename__ = "Review"
    
    review_id = Column(Integer, primary_key=True, autoincrement=True)
    annotation_id = Column(Integer, ForeignKey("Annotation.annotation_id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("Users.user_id", ondelete="CASCADE"), nullable=False)
    review_date = Column(DateTime, default=datetime.utcnow)
    feedback = Column(Text, nullable=True)
    status = Column(SQLEnum(ReviewStatus), default=ReviewStatus.PENDING)
    quality_score = Column(Float, nullable=True)  # Quality score 0-10
    
    # Relationships
    annotation = relationship("Annotation", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")

class AuditLog(Base):
    __tablename__ = "AuditLog"
    
    log_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.user_id", ondelete="CASCADE"), nullable=False)
    action = Column(String(255), nullable=False)
    entity_type = Column(String(50), nullable=True)  # Type of entity (Annotation, Task, etc.)
    entity_id = Column(Integer, nullable=True)  # ID of the entity
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)  # Changed from time_stamp to timestamp
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class Notification(Base):
    __tablename__ = "Notification"
    
    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.user_id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    created_date = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
