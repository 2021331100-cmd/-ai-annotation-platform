from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException
import models
import schemas

def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.project_id == project_id).first()

def get_projects(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    query = db.query(models.Project)
    if status:
        query = query.filter(models.Project.status == status)
    return query.offset(skip).limit(limit).all()

def update_project(db: Session, project_id: int, project_update: schemas.ProjectUpdate):
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    
    update_data = project_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    db_project = get_project(db, project_id)
    if not db_project:
        return False
    db.delete(db_project)
    db.commit()
    return True

# Dataset functions
def create_dataset(db: Session, dataset: schemas.DatasetCreate):
    db_dataset = models.Dataset(**dataset.dict())
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    return db_dataset

def get_dataset(db: Session, dataset_id: int):
    return db.query(models.Dataset).filter(models.Dataset.dataset_id == dataset_id).first()

def get_datasets(db: Session, skip: int = 0, limit: int = 100, project_id: Optional[int] = None):
    query = db.query(models.Dataset)
    if project_id:
        query = query.filter(models.Dataset.project_id == project_id)
    return query.offset(skip).limit(limit).all()

# Label functions
def create_label(db: Session, label: schemas.LabelCreate):
    db_label = models.Label(**label.dict())
    db.add(db_label)
    db.commit()
    db.refresh(db_label)
    return db_label

def get_labels(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Label).offset(skip).limit(limit).all()

def get_label(db: Session, label_id: int):
    return db.query(models.Label).filter(models.Label.label_id == label_id).first()

def update_label(db: Session, label_id: int, label: schemas.LabelCreate):
    db_label = db.query(models.Label).filter(models.Label.label_id == label_id).first()
    if not db_label:
        raise HTTPException(status_code=404, detail="Label not found")
    
    for key, value in label.dict().items():
        setattr(db_label, key, value)
    
    db.commit()
    db.refresh(db_label)
    return db_label

def delete_label(db: Session, label_id: int):
    db_label = db.query(models.Label).filter(models.Label.label_id == label_id).first()
    if not db_label:
        raise HTTPException(status_code=404, detail="Label not found")
    
    db.delete(db_label)
    db.commit()
    return True

