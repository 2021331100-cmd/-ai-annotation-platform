from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Form, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt

# Load environment variables
load_dotenv()

from database import get_db, engine
import models
import schemas
from services import annotation_service, project_service, user_service
from services.ai_service import AIAnnotationService, AIReviewService

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-please-use-long-random-string")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Data Annotation Platform",
    description="Enterprise platform for annotating data with task assignment, review workflows, and audit logging",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Vercel deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/")
def read_root():
    return {"message": "AI Data Annotation Platform API", "status": "running", "version": "2.0.0"}

# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================
@app.post("/api/auth/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user with hashed password"""
    # Check if username or email already exists
    if user_service.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if user_service.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # user_service.create_user already handles password hashing
    return user_service.create_user(db, user)

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    try:
        # Get user by username
        user = user_service.get_user_by_username(db, form_data.username)
        
        if not user:
            raise HTTPException(status_code=401, detail="Incorrect username or password")
        
        # Verify password using the pwd_context from main.py
        if not pwd_context.verify(form_data.password, user.password):
            raise HTTPException(status_code=401, detail="Incorrect username or password")
        
        # Create access token
        access_token = create_access_token(data={"sub": user.username, "user_id": user.user_id, "role": user.role})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.user_id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

# ==========================================
# USER ENDPOINTS
# ==========================================
@app.post("/api/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exists
    if user_service.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if user_service.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return user_service.create_user(db, user)

@app.get("/api/users/", response_model=List[schemas.User])
def list_users(skip: int = 0, limit: int = 100, role: Optional[str] = None, db: Session = Depends(get_db)):
    return user_service.get_users(db, skip, limit, role)

@app.get("/api/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/api/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db)):
    updated = user_service.update_user(db, user_id, user)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    success = user_service.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# ==========================================
# PROJECT ENDPOINTS
# ==========================================
@app.post("/api/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return project_service.create_project(db, project)

@app.get("/api/projects/", response_model=List[schemas.Project])
def list_projects(skip: int = 0, limit: int = 100, status: Optional[str] = None, db: Session = Depends(get_db)):
    return project_service.get_projects(db, skip, limit, status)

@app.get("/api/projects/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = project_service.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.put("/api/projects/{project_id}", response_model=schemas.Project)
def update_project(project_id: int, project: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    updated = project_service.update_project(db, project_id, project)
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    success = project_service.delete_project(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

# ==========================================
# DATASET ENDPOINTS
# ==========================================
@app.post("/api/datasets/", response_model=schemas.Dataset)
def create_dataset(dataset: schemas.DatasetCreate, db: Session = Depends(get_db)):
    return project_service.create_dataset(db, dataset)

@app.post("/api/datasets/upload/")
async def upload_dataset(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    name: str = Form(...),
    description: str = Form(""),
    db: Session = Depends(get_db)
):
    """Upload a dataset file (CSV, JSON, TXT, images)"""
    import os
    import json
    
    try:
        # Convert project_id to int
        try:
            project_id_int = int(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project_id")
        
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/datasets"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Parse file content based on type
        file_ext = file.filename.split('.')[-1].lower()
        data_items = []
        
        if file_ext == 'csv':
            import csv
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                data_items = list(reader)
        elif file_ext == 'json':
            with open(file_path, 'r', encoding='utf-8') as f:
                data_items = json.load(f)
        elif file_ext == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                data_items = [{'text': line.strip(), 'line_number': i+1} for i, line in enumerate(lines) if line.strip()]
        else:
            # For images and other files, just store file reference
            data_items = [{'file_path': file_path, 'filename': file.filename}]
        
        # Create dataset record
        dataset_data = schemas.DatasetCreate(
            dataset_name=name or file.filename,
            description=description or f"Uploaded file: {file.filename}",
            format=file_ext
        )
        
        dataset = project_service.create_dataset(db, dataset_data)
        
        return {
            "message": "Dataset uploaded successfully",
            "dataset_id": dataset.dataset_id,
            "file_name": file.filename,
            "file_path": file_path,
            "data_count": len(data_items),
            "data_preview": data_items[:5] if len(data_items) > 0 else []
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error during upload: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/api/datasets/bulk-upload")
async def bulk_upload_files(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    """
    Upload multiple files at once
    
    Args:
        files: List of files to upload
    
    Returns:
        Upload results with success and failed files
    """
    from services.bulk_upload_service import BulkUploadService
    from pathlib import Path
    
    results = await BulkUploadService.upload_multiple_files(files)
    
    # Create dataset entries for successful uploads
    created_datasets = []
    for success_file in results['success']:
        try:
            db_dataset = models.Dataset(
                dataset_name=success_file['filename'],
                description=f"Bulk uploaded {success_file['file_type']} file",
                format=Path(success_file['filename']).suffix
            )
            db.add(db_dataset)
            db.commit()
            db.refresh(db_dataset)
            
            created_datasets.append({
                'dataset_id': db_dataset.dataset_id,
                'filename': success_file['filename']
            })
        except Exception as e:
            print(f"Error creating dataset entry: {e}")
    
    results['created_datasets'] = created_datasets
    
    return results

@app.post("/api/datasets/upload-zip")
async def upload_zip_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload and extract a ZIP file containing multiple datasets
    
    Args:
        file: ZIP file to upload and extract
    
    Returns:
        Extraction results with all extracted files
    """
    from services.bulk_upload_service import BulkUploadService
    from pathlib import Path
    
    # Validate it's a ZIP file
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="File must be a ZIP archive")
    
    results = await BulkUploadService.extract_and_upload_zip(file)
    
    if 'error' in results:
        raise HTTPException(status_code=400, detail=results['error'])
    
    # Create dataset entries for extracted files
    created_datasets = []
    for success_file in results['success']:
        try:
            db_dataset = models.Dataset(
                dataset_name=success_file['filename'],
                description=f"Extracted from ZIP: {file.filename}",
                format=Path(success_file['filename']).suffix
            )
            db.add(db_dataset)
            db.commit()
            db.refresh(db_dataset)
            
            created_datasets.append({
                'dataset_id': db_dataset.dataset_id,
                'filename': success_file['filename']
            })
        except Exception as e:
            print(f"Error creating dataset entry: {e}")
    
    results['created_datasets'] = created_datasets
    
    return results

@app.get("/api/datasets/upload-stats")
def get_upload_statistics(db: Session = Depends(get_db)):
    """Get statistics about uploaded files"""
    from services.bulk_upload_service import BulkUploadService
    
    stats = BulkUploadService.get_upload_statistics()
    return stats

@app.get("/api/datasets/", response_model=List[schemas.Dataset])
def list_datasets(skip: int = 0, limit: int = 100, project_id: Optional[int] = None, db: Session = Depends(get_db)):
    """List all datasets with project information"""
    from sqlalchemy.orm import joinedload
    
    query = db.query(models.Dataset)
    if project_id:
        # Filter by project through tasks
        query = query.join(models.AnnotationTask).filter(models.AnnotationTask.project_id == project_id)
    
    datasets = query.offset(skip).limit(limit).all()
    
    # Enrich with project info from tasks
    for dataset in datasets:
        # Get first task associated with this dataset to get project
        task = db.query(models.AnnotationTask).filter(
            models.AnnotationTask.dataset_id == dataset.dataset_id
        ).first()
        
        if task and task.project:
            dataset.project = task.project
    
    return datasets

@app.get("/api/datasets/{dataset_id}", response_model=schemas.Dataset)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = project_service.get_dataset(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@app.get("/api/datasets/{dataset_id}/data")
def get_dataset_data(dataset_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get parsed data from uploaded dataset"""
    dataset = project_service.get_dataset(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    import json
    import csv
    
    data_items = []
    file_path = dataset.file_path
    
    if dataset.file_type == 'csv':
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            data_items = list(reader)
    elif dataset.file_type == 'json':
        with open(file_path, 'r', encoding='utf-8') as f:
            data_items = json.load(f)
    elif dataset.file_type == 'txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            data_items = [{'text': line.strip(), 'line_number': i+1} for i, line in enumerate(lines) if line.strip()]
    
    # Paginate
    total = len(data_items)
    paginated_items = data_items[skip:skip+limit]
    
    return {
        "dataset_id": dataset_id,
        "total": total,
        "items": paginated_items,
        "skip": skip,
        "limit": limit
    }

# ==========================================
# LABEL ENDPOINTS
# ==========================================
@app.post("/api/labels/", response_model=schemas.Label)
def create_label(label: schemas.LabelCreate, db: Session = Depends(get_db)):
    return project_service.create_label(db, label)

@app.get("/api/labels/", response_model=List[schemas.Label])
def list_labels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return project_service.get_labels(db, skip, limit)

@app.put("/api/labels/{label_id}", response_model=schemas.Label)
def update_label(label_id: int, label: schemas.LabelCreate, db: Session = Depends(get_db)):
    return project_service.update_label(db, label_id, label)

@app.delete("/api/labels/{label_id}")
def delete_label(label_id: int, db: Session = Depends(get_db)):
    project_service.delete_label(db, label_id)
    return {"message": "Label deleted successfully"}

# ==========================================
# ANNOTATION TASK ENDPOINTS
# ==========================================
@app.post("/api/tasks/", response_model=schemas.AnnotationTask)
def create_annotation_task(task: schemas.AnnotationTaskCreate, db: Session = Depends(get_db)):
    return annotation_service.create_annotation_task(db, task)

@app.get("/api/tasks/", response_model=List[schemas.AnnotationTask])
def list_annotation_tasks(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return annotation_service.get_annotation_tasks(db, project_id, skip, limit)

@app.get("/api/tasks/{task_id}", response_model=schemas.AnnotationTask)
def get_annotation_task(task_id: int, db: Session = Depends(get_db)):
    task = annotation_service.get_annotation_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# ==========================================
# TASK ASSIGNMENT ENDPOINTS
# ==========================================
@app.post("/api/assignments/", response_model=schemas.TaskAssignment)
def create_task_assignment(assignment: schemas.TaskAssignmentCreate, db: Session = Depends(get_db)):
    return annotation_service.create_task_assignment(db, assignment)

@app.post("/api/assignments/bulk/")
def bulk_assign_tasks(
    task_ids: List[int],
    user_ids: List[int],
    assigned_by: int,
    db: Session = Depends(get_db)
):
    """Bulk assign multiple tasks to multiple users"""
    assignments = []
    errors = []
    
    for task_id in task_ids:
        # Verify task exists
        task = annotation_service.get_annotation_task(db, task_id)
        if not task:
            errors.append(f"Task {task_id} not found")
            continue
        
        for user_id in user_ids:
            # Verify user exists
            user = user_service.get_user(db, user_id)
            if not user:
                errors.append(f"User {user_id} not found")
                continue
            
            # Check if already assigned
            existing = annotation_service.get_assignment_by_task_and_user(db, task_id, user_id)
            if existing:
                errors.append(f"Task {task_id} already assigned to user {user_id}")
                continue
            
            try:
                assignment_data = schemas.TaskAssignmentCreate(
                    task_id=task_id,
                    assigned_to=user_id,
                    assigned_by=assigned_by,
                    status="Pending"
                )
                assignment = annotation_service.create_task_assignment(db, assignment_data)
                assignments.append({
                    "assignment_id": assignment.assignment_id,
                    "task_id": task_id,
                    "user_id": user_id
                })
            except Exception as e:
                errors.append(f"Failed to assign task {task_id} to user {user_id}: {str(e)}")
    
    return {
        "message": f"Bulk assignment completed",
        "assignments_created": len(assignments),
        "assignments": assignments,
        "errors": errors
    }

@app.post("/api/assignments/auto-distribute/")
def auto_distribute_tasks(
    project_id: int,
    user_ids: List[int],
    assigned_by: int,
    db: Session = Depends(get_db)
):
    """Automatically distribute tasks evenly among users"""
    # Get all unassigned tasks for the project
    tasks = annotation_service.get_annotation_tasks(db, project_id=project_id)
    unassigned_tasks = [t for t in tasks if not annotation_service.get_task_assignments_by_task(db, t.task_id)]
    
    if not unassigned_tasks:
        return {"message": "No unassigned tasks found", "assignments": []}
    
    if not user_ids:
        raise HTTPException(status_code=400, detail="No users provided")
    
    # Distribute tasks round-robin
    assignments = []
    for i, task in enumerate(unassigned_tasks):
        user_id = user_ids[i % len(user_ids)]
        
        try:
            assignment_data = schemas.TaskAssignmentCreate(
                task_id=task.task_id,
                assigned_to=user_id,
                assigned_by=assigned_by,
                status="Pending"
            )
            assignment = annotation_service.create_task_assignment(db, assignment_data)
            assignments.append({
                "assignment_id": assignment.assignment_id,
                "task_id": task.task_id,
                "user_id": user_id
            })
        except Exception as e:
            continue
    
    return {
        "message": f"Auto-distributed {len(assignments)} tasks to {len(user_ids)} users",
        "assignments_created": len(assignments),
        "assignments": assignments
    }

@app.get("/api/assignments/user/{user_id}", response_model=List[schemas.TaskAssignment])
def get_user_assignments(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return annotation_service.get_task_assignments_by_user(db, user_id, skip, limit)

@app.get("/api/assignments/task/{task_id}", response_model=List[schemas.TaskAssignment])
def get_task_assignments(task_id: int, db: Session = Depends(get_db)):
    return annotation_service.get_task_assignments_by_task(db, task_id)

@app.delete("/api/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    success = annotation_service.delete_task_assignment(db, assignment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": "Assignment deleted successfully"}

# ==========================================
# ANNOTATION ENDPOINTS
# ==========================================
@app.post("/api/annotations/", response_model=schemas.Annotation)
def create_annotation(annotation: schemas.AnnotationCreate, db: Session = Depends(get_db)):
    return annotation_service.create_annotation(db, annotation)

@app.get("/api/annotations/{annotation_id}", response_model=schemas.Annotation)
def get_annotation(annotation_id: int, db: Session = Depends(get_db)):
    annotation = annotation_service.get_annotation(db, annotation_id)
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return annotation

@app.get("/api/annotations/task/{task_id}", response_model=List[schemas.Annotation])
def get_task_annotations(task_id: int, db: Session = Depends(get_db)):
    return annotation_service.get_annotations_by_task(db, task_id)

@app.get("/api/annotations/user/{user_id}", response_model=List[schemas.Annotation])
def get_user_annotations(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return annotation_service.get_annotations_by_user(db, user_id, skip, limit)

@app.put("/api/annotations/{annotation_id}", response_model=schemas.Annotation)
def update_annotation(
    annotation_id: int,
    annotation: schemas.AnnotationUpdate,
    user_id: int,
    db: Session = Depends(get_db)
):
    updated = annotation_service.update_annotation(db, annotation_id, annotation, user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return updated

@app.delete("/api/annotations/{annotation_id}")
def delete_annotation(annotation_id: int, user_id: int, db: Session = Depends(get_db)):
    success = annotation_service.delete_annotation(db, annotation_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return {"message": "Annotation deleted successfully"}

# ==========================================
# REVIEW ENDPOINTS
# ==========================================
@app.post("/api/reviews/", response_model=schemas.Review)
def create_review(review: schemas.ReviewCreate, db: Session = Depends(get_db)):
    return annotation_service.create_review(db, review)

@app.get("/api/reviews/annotation/{annotation_id}", response_model=List[schemas.Review])
def get_annotation_reviews(annotation_id: int, db: Session = Depends(get_db)):
    return annotation_service.get_reviews_by_annotation(db, annotation_id)

@app.get("/api/reviews/reviewer/{reviewer_id}", response_model=List[schemas.Review])
def get_reviewer_reviews(reviewer_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return annotation_service.get_reviews_by_reviewer(db, reviewer_id, skip, limit)

@app.put("/api/reviews/{review_id}", response_model=schemas.Review)
def update_review(review_id: int, review: schemas.ReviewUpdate, db: Session = Depends(get_db)):
    updated = annotation_service.update_review(db, review_id, review)
    if not updated:
        raise HTTPException(status_code=404, detail="Review not found")
    return updated

# ==========================================
# AUDIT LOG ENDPOINTS
# ==========================================
@app.get("/api/audit-logs/", response_model=List[schemas.AuditLog])
def get_audit_logs(user_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return annotation_service.get_audit_logs(db, user_id, skip, limit)

# ==========================================
# NOTIFICATION ENDPOINTS
# ==========================================
@app.post("/api/notifications/", response_model=schemas.Notification)
def create_notification(notification: schemas.NotificationCreate, db: Session = Depends(get_db)):
    return annotation_service.create_notification(db, notification)

@app.get("/api/notifications/user/{user_id}", response_model=List[schemas.Notification])
def get_user_notifications(user_id: int, unread_only: bool = False, db: Session = Depends(get_db)):
    return annotation_service.get_user_notifications(db, user_id, unread_only)

@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    success = annotation_service.mark_notification_read(db, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

# ==========================================
# AI ANNOTATION ENDPOINTS
# ==========================================
@app.post("/api/ai/annotate")
def ai_auto_annotate(payload: dict = Body(...)):
    """
    Accept a JSON body with keys: data, annotation_type, labels (optional), max_length (optional)
    """
    data = payload.get("data")
    annotation_type = payload.get("annotation_type")
    labels = payload.get("labels")
    max_length = payload.get("max_length", 100)
    """
    AI-powered automatic annotation
    Supported types: sentiment_analysis, summarization, named_entity_recognition, 
                     text_classification, object_detection
    """
    kwargs = {}
    if labels:
        kwargs["labels"] = labels
    if max_length:
        kwargs["max_length"] = max_length
    
    result = AIAnnotationService.auto_annotate(data, annotation_type, **kwargs)
    return result

@app.post("/api/ai/annotate/batch")
def ai_batch_annotate(payload: dict = Body(...), db: Session = Depends(get_db)):
    """Batch annotate using JSON body: { dataset_id, annotation_type, labels }"""
    dataset_id = payload.get("dataset_id")
    annotation_type = payload.get("annotation_type")
    labels = payload.get("labels")
    """
    Batch AI annotation for entire dataset
    """
    # Get dataset data
    dataset = project_service.get_dataset(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # For demo, simulate batch annotation on first 10 items
    results = []
    for i in range(min(10, 10)):  # Limit to 10 for demo
        data = {"text": f"Sample text {i} from dataset", "index": i}
        kwargs = {"labels": labels} if labels else {}
        result = AIAnnotationService.auto_annotate(data, annotation_type, **kwargs)
        results.append(result)
    
    return {
        "dataset_id": dataset_id,
        "annotation_type": annotation_type,
        "total_annotated": len(results),
        "results": results
    }

@app.post("/api/ai/review")
def ai_auto_review(payload: dict = Body(...)):
    """AI review expects JSON body: { annotation_id, annotation_data }"""
    annotation_id = payload.get("annotation_id")
    annotation_data = payload.get("annotation_data")
    """
    AI-powered automatic review of annotation
    """
    review_result = AIReviewService.auto_review(annotation_id, annotation_data)
    return review_result

@app.post("/api/ai/review/quality")
def ai_quality_check(payload: dict = Body(...)):
    """Quality check expects JSON body: { annotation_data }"""
    annotation_data = payload.get("annotation_data")
    """
    Check annotation quality using AI
    """
    quality_result = AIReviewService.quality_check(annotation_data)
    return quality_result

@app.post("/api/ai/review/consistency")
def ai_consistency_check(payload: dict = Body(...)):
    """Consistency check expects JSON body: { annotations: [...] }"""
    annotations = payload.get("annotations")
    """
    Check consistency across multiple annotations
    """
    consistency_result = AIReviewService.consistency_check(annotations)
    return consistency_result

# ==================== ADVANCED FEATURES ====================
from services.advanced_features import (
    ActiveLearningService, VersionControlService, QualityMetricsService,
    ConsensusService, ExportService
)
from services.annotation_types import AnnotationTypeService
from services.crowd_management import CrowdManagementService
from services.resources_service import ResourcesService

# Active Learning endpoints
@app.get("/api/active-learning/uncertain-samples/{project_id}")
def get_uncertain_samples(project_id: int, limit: int = 10, db: Session = Depends(get_db)):
    """Get most uncertain samples for active learning"""
    samples = ActiveLearningService.get_uncertain_samples(db, project_id, limit)
    return {"project_id": project_id, "uncertain_samples": samples}

@app.get("/api/active-learning/suggest-tasks/{user_id}/{project_id}")
def suggest_next_tasks(user_id: int, project_id: int, count: int = 5, db: Session = Depends(get_db)):
    """AI-powered task recommendation for annotators"""
    suggestions = ActiveLearningService.suggest_next_tasks(db, user_id, project_id, count)
    return {"user_id": user_id, "project_id": project_id, "suggested_tasks": suggestions}

# Version Control endpoints
@app.post("/api/annotations/{annotation_id}/version")
def create_annotation_version(
    annotation_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Create a new version of an annotation"""
    user_id = payload.get("user_id")
    content = payload.get("content")
    label_ids = payload.get("label_ids", [])
    description = payload.get("description", "")
    
    version = VersionControlService.create_version(
        db, annotation_id, user_id, content, label_ids, description
    )
    return {"annotation_id": annotation_id, "version": version}

@app.get("/api/annotations/{annotation_id}/versions")
def get_annotation_versions(annotation_id: int, db: Session = Depends(get_db)):
    """Get version history of an annotation"""
    history = VersionControlService.get_version_history(db, annotation_id)
    return {"annotation_id": annotation_id, "versions": history}

@app.post("/api/annotations/{annotation_id}/restore/{version_id}")
def restore_annotation_version(
    annotation_id: int,
    version_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Restore annotation to a previous version"""
    restored = VersionControlService.restore_version(db, annotation_id, version_id, user_id)
    if not restored:
        raise HTTPException(status_code=404, detail="Version not found or restore failed")
    return {"message": "Version restored successfully", "annotation_id": annotation_id}

# Quality Metrics endpoints
@app.get("/api/metrics/annotator/{user_id}")
def get_annotator_metrics(user_id: int, days: int = 30, db: Session = Depends(get_db)):
    """Get performance metrics for an annotator"""
    metrics = QualityMetricsService.calculate_annotator_metrics(db, user_id, days)
    return metrics

@app.get("/api/metrics/project/{project_id}")
def get_project_metrics(project_id: int, db: Session = Depends(get_db)):
    """Get overall project quality metrics"""
    metrics = QualityMetricsService.calculate_project_metrics(db, project_id)
    return metrics

# Consensus endpoints
@app.get("/api/consensus/agreement/{task_id}")
def get_inter_annotator_agreement(task_id: int, db: Session = Depends(get_db)):
    """Calculate inter-annotator agreement for a task"""
    agreement = ConsensusService.calculate_inter_annotator_agreement(db, task_id)
    return agreement

@app.get("/api/consensus/labels/{task_id}")
def get_consensus_labels(task_id: int, threshold: float = 0.5, db: Session = Depends(get_db)):
    """Get consensus labels based on majority vote"""
    labels = ConsensusService.get_consensus_labels(db, task_id, threshold)
    return {"task_id": task_id, "consensus_label_ids": labels, "threshold": threshold}

@app.post("/api/consensus/gold-standard/{task_id}")
def create_gold_standard(
    task_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Create gold standard annotation"""
    label_ids = payload.get("label_ids", [])
    created_by = payload.get("created_by")
    
    gold = ConsensusService.create_gold_standard(db, task_id, label_ids, created_by)
    return {"task_id": task_id, "gold_annotation_id": gold.annotation_id}

# Export endpoints
@app.get("/api/export/coco/{project_id}")
def export_coco(project_id: int, db: Session = Depends(get_db)):
    """Export annotations in COCO format"""
    coco_data = ExportService.export_to_coco(db, project_id)
    return coco_data

@app.get("/api/export/jsonl/{project_id}")
def export_jsonl(project_id: int, db: Session = Depends(get_db)):
    """Export annotations in JSONL format"""
    jsonl_data = ExportService.export_to_jsonl(db, project_id)
    return jsonl_data

@app.get("/api/export/csv/{project_id}")
def export_csv(project_id: int, db: Session = Depends(get_db)):
    """Export annotations in CSV format"""
    csv_data = ExportService.export_to_csv(db, project_id)
    return {"data": csv_data}

@app.get("/api/export/yolo/{project_id}")
def export_yolo(project_id: int, db: Session = Depends(get_db)):
    """Export annotations in YOLO format for object detection"""
    from services.export_formats import YOLOExportService
    yolo_data = YOLOExportService.export_to_yolo(db, project_id)
    return yolo_data

@app.get("/api/export/voc/{project_id}")
def export_voc(project_id: int, db: Session = Depends(get_db)):
    """Export annotations in Pascal VOC XML format"""
    from services.export_formats import PascalVOCExportService
    voc_data = PascalVOCExportService.export_to_voc(db, project_id)
    return voc_data

@app.get("/api/export/conll/{project_id}")
def export_conll(project_id: int, db: Session = Depends(get_db)):
    """Export annotations in CoNLL format for NER"""
    from services.export_formats import CoNLLExportService
    conll_data = CoNLLExportService.export_to_conll(db, project_id)
    return conll_data

@app.get("/api/export/zip/{project_id}")
def export_zip(project_id: int, format: str = "all", db: Session = Depends(get_db)):
    """
    Export project as ZIP file with all annotations in multiple formats
    
    Args:
        project_id: Project ID to export
        format: Export format - 'yolo', 'voc', 'coco', 'jsonl', 'csv', 'conll', or 'all' (default)
    
    Returns:
        ZIP file with annotations in requested format(s)
    """
    from fastapi.responses import Response
    from services.export_formats import ZIPExportService
    
    try:
        zip_bytes = ZIPExportService.export_project_as_zip(db, project_id, format)
        project = db.query(models.Project).filter(models.Project.project_id == project_id).first()
        filename = f"{project.project_name.replace(' ', '_')}_export.zip"
        
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ANNOTATION TYPES ====================
@app.get("/api/annotation-types/")
def get_annotation_types():
    """Get all supported annotation types (Text, Audio, Image, Video, Multimodal)"""
    return AnnotationTypeService.get_annotation_types()

@app.post("/api/annotations/typed/")
def create_typed_annotation(
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Create annotation with specific type (sentiment, intent, NER, bounding box, etc.)"""
    task_id = payload.get("task_id")
    user_id = payload.get("user_id")
    annotation_type = payload.get("annotation_type")
    data = payload.get("data", {})
    label_ids = payload.get("label_ids", [])
    
    annotation = AnnotationTypeService.create_annotation_with_type(
        db, task_id, user_id, annotation_type, data, label_ids
    )
    
    return {
        "message": "Typed annotation created successfully",
        "annotation_id": annotation.annotation_id,
        "type": annotation_type
    }

# ==================== CROWD MANAGEMENT ====================
@app.get("/api/crowd/leaderboard")
def get_annotator_leaderboard(
    time_period: str = 'week',
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get annotator leaderboard by performance"""
    leaderboard = CrowdManagementService.get_annotator_leaderboard(db, time_period, limit)
    return {"time_period": time_period, "leaderboard": leaderboard}

@app.get("/api/crowd/annotator/{user_id}/stats")
def get_annotator_performance(
    user_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get detailed performance statistics for an annotator"""
    stats = CrowdManagementService.get_annotator_stats(db, user_id, days)
    return stats

@app.get("/api/crowd/languages")
def get_supported_languages(db: Session = Depends(get_db)):
    """Get list of supported languages with annotator availability"""
    languages = CrowdManagementService.get_language_support(db)
    return {"total_languages": len(languages), "languages": languages}

@app.post("/api/crowd/assign-experts")
def assign_expert_annotators(
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Intelligently assign expert annotators to a task"""
    task_id = payload.get("task_id")
    expertise = payload.get("expertise_required", "general")
    language = payload.get("language", "en")
    count = payload.get("count", 3)
    
    assigned_user_ids = CrowdManagementService.assign_expert_annotators(
        db, task_id, expertise, language, count
    )
    
    # Create task assignments
    from services import annotation_service, user_service
    assignments = []
    for user_id in assigned_user_ids:
        assignment_data = schemas.TaskAssignmentCreate(
            task_id=task_id,
            user_id=user_id,
            assigned_by=payload.get("assigned_by", 1),
            status="Pending"
        )
        assignment = annotation_service.create_task_assignment(db, assignment_data)
        assignments.append({
            "assignment_id": assignment.assignment_id,
            "user_id": user_id
        })
    
    return {
        "task_id": task_id,
        "experts_assigned": len(assignments),
        "assignments": assignments
    }

@app.get("/api/crowd/metrics")
def get_crowd_metrics(db: Session = Depends(get_db)):
    """Get overall crowd performance metrics"""
    metrics = CrowdManagementService.get_crowd_metrics(db)
    return metrics

@app.post("/api/crowd/create-pool")
def create_annotator_pool(
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Create a qualified annotator pool for a project"""
    project_id = payload.get("project_id")
    criteria = payload.get("criteria", {})
    
    pool = CrowdManagementService.create_annotator_pool(db, project_id, criteria)
    return pool

# ==================== RESOURCES & EDUCATION ====================
@app.get("/api/resources/core-concepts")
def get_core_concepts():
    """Get core AI/ML concepts (High-Quality Data, NLP, Generative AI, Computer Vision, Multimodal)"""
    return ResourcesService.get_core_concepts()

@app.get("/api/resources/case-studies")
def get_case_studies():
    """Get platform case studies and success stories"""
    return ResourcesService.get_case_studies()

@app.get("/api/resources/blog")
def get_blog_posts():
    """Get blog posts and articles"""
    return ResourcesService.get_blog_posts()

@app.get("/api/resources/whitepapers")
def get_whitepapers():
    """Get whitepapers and research documents"""
    return ResourcesService.get_whitepapers()

@app.get("/api/resources/events")
def get_events():
    """Get upcoming events and conferences"""
    return ResourcesService.get_events()

@app.get("/api/resources/webinars")
def get_webinars():
    """Get webinars and online training sessions"""
    return ResourcesService.get_webinars()

@app.get("/api/resources/search")
def search_resources(
    q: str,
    resource_type: str = 'all'
):
    """Search across all resources (blog, case_study, whitepaper, event, webinar)"""
    return ResourcesService.search_resources(q, resource_type)

# ==================== CLOUD STORAGE ====================
@app.post("/api/cloud-storage/s3/upload")
async def upload_to_s3(
    file: UploadFile = File(...),
    folder: str = "datasets",
    db: Session = Depends(get_db)
):
    """Upload file to AWS S3"""
    from services.cloud_storage_service import S3StorageService
    import tempfile
    
    try:
        # Initialize S3 service
        s3_service = S3StorageService()
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Upload to S3
        result = s3_service.upload_file(temp_path, file.filename, folder)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        if result['success']:
            # Create dataset entry
            db_dataset = models.Dataset(
                dataset_name=file.filename,
                description=f"Uploaded to S3: {result['s3_key']}",
                format=os.path.splitext(file.filename)[1]
            )
            db.add(db_dataset)
            db.commit()
            db.refresh(db_dataset)
            
            result['dataset_id'] = db_dataset.dataset_id
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cloud-storage/s3/list")
def list_s3_files(folder: str = "datasets"):
    """List files in S3 bucket"""
    from services.cloud_storage_service import S3StorageService
    
    try:
        s3_service = S3StorageService()
        result = s3_service.list_files(folder)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cloud-storage/s3/presigned-url")
def get_s3_presigned_url(s3_key: str, expiration: int = 3600):
    """Generate presigned URL for S3 object"""
    from services.cloud_storage_service import S3StorageService
    
    try:
        s3_service = S3StorageService()
        url = s3_service.generate_presigned_url(s3_key, expiration)
        
        if url:
            return {"success": True, "url": url, "expiration": expiration}
        else:
            return {"success": False, "error": "Failed to generate URL"}
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/cloud-storage/s3/delete")
def delete_s3_file(s3_key: str):
    """Delete file from S3"""
    from services.cloud_storage_service import S3StorageService
    
    try:
        s3_service = S3StorageService()
        result = s3_service.delete_file(s3_key)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== OAUTH AUTHENTICATION ====================
@app.get("/api/auth/oauth/providers")
def get_oauth_providers():
    """Get list of configured OAuth providers"""
    from services.oauth_service import is_oauth_configured
    
    providers = is_oauth_configured()
    return {
        'providers': [{'name': name, 'enabled': enabled} for name, enabled in providers.items()]
    }

@app.get("/api/auth/oauth/{provider}/login")
async def oauth_login(provider: str, request: Request):
    """Initiate OAuth login flow"""
    from services.oauth_service import oauth
    from starlette.requests import Request as StarletteRequest
    
    if provider not in ['google', 'github']:
        raise HTTPException(status_code=400, detail="Unsupported OAuth provider")
    
    # Convert FastAPI request to Starlette request for authlib
    starlette_request = StarletteRequest(request.scope, request.receive)
    
    redirect_uri = f"{request.base_url}api/auth/oauth/{provider}/callback"
    
    try:
        return await oauth.create_client(provider).authorize_redirect(starlette_request, redirect_uri)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/oauth/{provider}/callback")
async def oauth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    """Handle OAuth callback"""
    from services.oauth_service import oauth, OAuthService
    from starlette.requests import Request as StarletteRequest
    
    if provider not in ['google', 'github']:
        raise HTTPException(status_code=400, detail="Unsupported OAuth provider")
    
    starlette_request = StarletteRequest(request.scope, request.receive)
    
    try:
        # Get token from OAuth provider
        token = await oauth.create_client(provider).authorize_access_token(starlette_request)
        
        # Get user info
        if provider == 'google':
            user_info = OAuthService.get_google_user_info(token)
        elif provider == 'github':
            user_info = OAuthService.get_github_user_info(token)
        else:
            raise HTTPException(status_code=400, detail="Unsupported provider")
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from OAuth provider")
        
        # Create or get user
        user = OAuthService.create_or_get_user_from_oauth(db, user_info)
        
        # Create access token
        access_token = create_access_token(data={"sub": user.username, "user_id": user.user_id, "role": user.role})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== OCR ENDPOINTS ====================
@app.post("/api/ocr/extract-text")
async def extract_text_from_image(
    file: UploadFile = File(...),
    lang: str = "eng",
    preprocess: bool = True
):
    """
    Extract text from uploaded image using OCR
    
    Args:
        file: Image file (JPG, PNG, etc.)
        lang: Language code (eng, fra, deu, etc.)
        preprocess: Apply image preprocessing for better OCR
    
    Returns:
        Extracted text with confidence scores
    """
    from services.ocr_service import OCRService, is_tesseract_installed
    import tempfile
    
    if not is_tesseract_installed():
        raise HTTPException(
            status_code=500,
            detail="Tesseract OCR is not installed. Please install it first."
        )
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Preprocess if requested
        if preprocess:
            temp_path = OCRService.preprocess_image_for_ocr(temp_path, temp_path)
        
        # Extract text
        result = OCRService.extract_text_from_image(temp_path, lang)
        
        # Clean up
        os.unlink(temp_path)
        
        if result['success']:
            result['filename'] = file.filename
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ocr/extract-pdf")
async def extract_text_from_pdf(
    file: UploadFile = File(...),
    first_page: int = 1,
    last_page: Optional[int] = None
):
    """
    Extract text from PDF using OCR
    
    Args:
        file: PDF file
        first_page: First page to process (1-indexed)
        last_page: Last page to process (None for all)
    
    Returns:
        Extracted text from all pages
    """
    from services.ocr_service import OCRService, is_tesseract_installed
    import tempfile
    
    if not is_tesseract_installed():
        raise HTTPException(
            status_code=500,
            detail="Tesseract OCR is not installed"
        )
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        # Save PDF temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Extract text
        result = OCRService.extract_text_from_pdf(temp_path, first_page, last_page)
        
        # Clean up
        os.unlink(temp_path)
        
        if result['success']:
            result['filename'] = file.filename
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ocr/languages")
def get_supported_languages():
    """Get list of languages supported by OCR"""
    from services.ocr_service import OCRService, is_tesseract_installed
    
    if not is_tesseract_installed():
        # Return default list
        return {
            'languages': ['eng', 'fra', 'deu', 'spa', 'ita', 'por', 'rus', 'ara', 'chi_sim', 'jpn'],
            'tesseract_installed': False
        }
    
    try:
        langs = OCRService.get_supported_languages()
        return {
            'languages': langs,
            'tesseract_installed': True
        }
    except Exception as e:
        return {
            'error': str(e),
            'tesseract_installed': False
        }

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 8000))
    host = os.getenv("API_HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "True").lower() == "true"
    uvicorn.run("main:app", host=host, port=port, reload=False)
