from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Form, Body
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
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
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

@app.get("/api/datasets/", response_model=List[schemas.Dataset])
def list_datasets(skip: int = 0, limit: int = 100, project_id: Optional[int] = None, db: Session = Depends(get_db)):
    return project_service.get_datasets(db, skip, limit, project_id)

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

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 8000))
    host = os.getenv("API_HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "True").lower() == "true"
    uvicorn.run("main:app", host=host, port=port, reload=False)
