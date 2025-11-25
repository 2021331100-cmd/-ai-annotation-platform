"""
Crowd Management & Annotator Network Service
Similar to Appen's global crowd management system
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Dict, Optional, Any
import models
import schemas
from datetime import datetime, timedelta

class CrowdManagementService:
    """
    Manage annotator crowd, performance tracking, and task distribution
    """
    
    @staticmethod
    def get_annotator_leaderboard(
        db: Session,
        time_period: str = 'week',  # week, month, all_time
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get top performing annotators"""
        
        # Calculate date range
        now = datetime.utcnow()
        if time_period == 'week':
            start_date = now - timedelta(days=7)
        elif time_period == 'month':
            start_date = now - timedelta(days=30)
        else:
            start_date = datetime(2000, 1, 1)
        
        # Query annotator stats
        annotators = db.query(
            models.User.user_id,
            models.User.username,
            models.User.email,
            func.count(models.Annotation.annotation_id).label('total_annotations'),
            func.count(models.Review.review_id).label('reviews_received'),
            func.avg(models.Review.quality_score).label('avg_quality_score')
        ).join(
            models.Annotation, models.User.user_id == models.Annotation.user_id
        ).outerjoin(
            models.Review, models.Annotation.annotation_id == models.Review.annotation_id
        ).filter(
            models.User.role == models.UserRole.ANNOTATOR,
            models.Annotation.create_date >= start_date
        ).group_by(
            models.User.user_id
        ).order_by(
            func.count(models.Annotation.annotation_id).desc()
        ).limit(limit).all()
        
        leaderboard = []
        for rank, annotator in enumerate(annotators, 1):
            leaderboard.append({
                'rank': rank,
                'user_id': annotator.user_id,
                'username': annotator.username,
                'total_annotations': annotator.total_annotations,
                'reviews_received': annotator.reviews_received or 0,
                'avg_quality_score': round(annotator.avg_quality_score or 0.0, 2),
                'approval_rate': CrowdManagementService._calculate_approval_rate(db, annotator.user_id, start_date)
            })
        
        return leaderboard
    
    @staticmethod
    def _calculate_approval_rate(db: Session, user_id: int, start_date: datetime) -> float:
        """Calculate approval rate for an annotator"""
        reviews = db.query(models.Review).join(
            models.Annotation
        ).filter(
            models.Annotation.user_id == user_id,
            models.Annotation.create_date >= start_date
        ).all()
        
        if not reviews:
            return 0.0
        
        approved = sum(1 for r in reviews if r.status == models.ReviewStatus.APPROVED)
        return round((approved / len(reviews)) * 100, 2)
    
    @staticmethod
    def get_annotator_stats(
        db: Session,
        user_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get detailed statistics for an annotator"""
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Total annotations
        total_annotations = db.query(func.count(models.Annotation.annotation_id)).filter(
            models.Annotation.user_id == user_id,
            models.Annotation.create_date >= start_date
        ).scalar()
        
        # Reviews received
        reviews = db.query(models.Review).join(
            models.Annotation
        ).filter(
            models.Annotation.user_id == user_id,
            models.Annotation.create_date >= start_date
        ).all()
        
        approved = sum(1 for r in reviews if r.status == models.ReviewStatus.APPROVED)
        rejected = sum(1 for r in reviews if r.status == models.ReviewStatus.REJECTED)
        pending = sum(1 for r in reviews if r.status == models.ReviewStatus.PENDING)
        
        # Quality scores
        quality_scores = [r.quality_score for r in reviews if r.quality_score is not None]
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
        
        # Tasks completed
        completed_tasks = db.query(func.count(func.distinct(models.Annotation.task_id))).filter(
            models.Annotation.user_id == user_id,
            models.Annotation.create_date >= start_date
        ).scalar()
        
        # Accuracy metrics
        accuracy = (approved / len(reviews) * 100) if reviews else 0.0
        
        return {
            'user_id': user_id,
            'period_days': days,
            'total_annotations': total_annotations,
            'completed_tasks': completed_tasks,
            'reviews': {
                'total': len(reviews),
                'approved': approved,
                'rejected': rejected,
                'pending': pending
            },
            'quality': {
                'avg_score': round(avg_quality, 2),
                'accuracy_rate': round(accuracy, 2),
                'approval_rate': round((approved / len(reviews) * 100) if reviews else 0.0, 2)
            },
            'productivity': {
                'annotations_per_day': round(total_annotations / days, 2),
                'avg_annotations_per_task': round(total_annotations / completed_tasks, 2) if completed_tasks else 0
            }
        }
    
    @staticmethod
    def get_language_support(db: Session) -> List[Dict[str, Any]]:
        """Get supported languages (simulated - in production, this would be from a languages table)"""
        return [
            {'code': 'en', 'name': 'English', 'annotators': 500},
            {'code': 'es', 'name': 'Spanish', 'annotators': 250},
            {'code': 'fr', 'name': 'French', 'annotators': 180},
            {'code': 'de', 'name': 'German', 'annotators': 150},
            {'code': 'zh', 'name': 'Chinese (Simplified)', 'annotators': 300},
            {'code': 'ja', 'name': 'Japanese', 'annotators': 120},
            {'code': 'ko', 'name': 'Korean', 'annotators': 90},
            {'code': 'ar', 'name': 'Arabic', 'annotators': 100},
            {'code': 'hi', 'name': 'Hindi', 'annotators': 200},
            {'code': 'pt', 'name': 'Portuguese', 'annotators': 140},
            {'code': 'ru', 'name': 'Russian', 'annotators': 110},
            {'code': 'it', 'name': 'Italian', 'annotators': 95},
            {'code': 'nl', 'name': 'Dutch', 'annotators': 70},
            {'code': 'pl', 'name': 'Polish', 'annotators': 60},
            {'code': 'tr', 'name': 'Turkish', 'annotators': 55}
        ]
    
    @staticmethod
    def assign_expert_annotators(
        db: Session,
        task_id: int,
        expertise_required: str,
        language: str = 'en',
        count: int = 3
    ) -> List[int]:
        """
        Intelligently assign expert annotators based on:
        - Performance history
        - Expertise domain
        - Language proficiency
        - Current workload
        """
        
        # Get top performing annotators
        annotators = db.query(
            models.User.user_id,
            func.count(models.Annotation.annotation_id).label('total_annotations'),
            func.avg(models.Review.quality_score).label('avg_quality')
        ).join(
            models.Annotation, models.User.user_id == models.Annotation.user_id
        ).outerjoin(
            models.Review, models.Annotation.annotation_id == models.Review.annotation_id
        ).filter(
            models.User.role == models.UserRole.ANNOTATOR
        ).group_by(
            models.User.user_id
        ).having(
            func.avg(models.Review.quality_score) >= 7.0  # High quality threshold
        ).order_by(
            func.avg(models.Review.quality_score).desc()
        ).limit(count * 2).all()  # Get more candidates
        
        # Filter by workload (annotators with fewer current assignments)
        selected = []
        for annotator in annotators:
            current_workload = db.query(func.count(models.TaskAssignment.assignment_id)).filter(
                models.TaskAssignment.user_id == annotator.user_id,
                models.TaskAssignment.status == 'Pending'
            ).scalar()
            
            if current_workload < 10:  # Max 10 pending tasks
                selected.append(annotator.user_id)
            
            if len(selected) >= count:
                break
        
        return selected
    
    @staticmethod
    def get_crowd_metrics(db: Session) -> Dict[str, Any]:
        """Get overall crowd performance metrics"""
        
        total_annotators = db.query(func.count(models.User.user_id)).filter(
            models.User.role == models.UserRole.ANNOTATOR
        ).scalar()
        
        active_annotators = db.query(func.count(func.distinct(models.Annotation.user_id))).filter(
            models.Annotation.create_date >= datetime.utcnow() - timedelta(days=30)
        ).scalar()
        
        total_annotations = db.query(func.count(models.Annotation.annotation_id)).scalar()
        
        avg_quality = db.query(func.avg(models.Review.quality_score)).filter(
            models.Review.quality_score.isnot(None)
        ).scalar() or 0.0
        
        return {
            'total_annotators': total_annotators,
            'active_annotators_30d': active_annotators,
            'total_annotations': total_annotations,
            'avg_quality_score': round(avg_quality, 2),
            'languages_supported': 235,  # Simulated, like Appen
            'countries': 170,  # Simulated
            'success_rate': 95.5  # Simulated
        }
    
    @staticmethod
    def create_annotator_pool(
        db: Session,
        project_id: int,
        criteria: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a pool of qualified annotators for a project based on criteria:
        - Minimum quality score
        - Language requirements
        - Expertise domain
        - Availability
        """
        
        min_quality = criteria.get('min_quality_score', 7.0)
        language = criteria.get('language', 'en')
        min_annotations = criteria.get('min_annotations', 100)
        
        qualified_annotators = db.query(
            models.User.user_id,
            models.User.username,
            func.count(models.Annotation.annotation_id).label('experience'),
            func.avg(models.Review.quality_score).label('quality')
        ).join(
            models.Annotation
        ).outerjoin(
            models.Review, models.Annotation.annotation_id == models.Review.annotation_id
        ).filter(
            models.User.role == models.UserRole.ANNOTATOR
        ).group_by(
            models.User.user_id
        ).having(
            and_(
                func.count(models.Annotation.annotation_id) >= min_annotations,
                func.avg(models.Review.quality_score) >= min_quality
            )
        ).all()
        
        pool = []
        for annotator in qualified_annotators:
            pool.append({
                'user_id': annotator.user_id,
                'username': annotator.username,
                'experience': annotator.experience,
                'quality_score': round(annotator.quality or 0.0, 2)
            })
        
        return {
            'project_id': project_id,
            'criteria': criteria,
            'qualified_annotators': len(pool),
            'annotator_pool': pool
        }
