"""
Advanced Annotation Types Service
Supports multiple annotation methodologies similar to Appen platform
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Any
import models
import schemas
import json
from datetime import datetime

class AnnotationTypeService:
    """
    Professional annotation type handlers for:
    - Text Annotation (Sentiment, Intent, Semantic, NER)
    - Audio Annotation (Transcription, Speaker ID, Emotion)
    - Image Annotation (Bounding Box, Segmentation, Classification)
    - Video Annotation (Object Tracking, Action Recognition)
    - Multimodal Annotation (Combined data types)
    """
    
    # TEXT ANNOTATION TYPES
    @staticmethod
    def sentiment_annotation(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sentiment Analysis Annotation
        Categories: Positive, Negative, Neutral, Mixed
        """
        text = data.get('text', '')
        annotation_data = {
            'type': 'sentiment',
            'text': text,
            'sentiment': data.get('sentiment', 'neutral'),  # positive, negative, neutral, mixed
            'confidence': data.get('confidence', 0.0),
            'emotions': data.get('emotions', []),  # joy, sadness, anger, fear, surprise
            'intensity': data.get('intensity', 'medium'),  # low, medium, high
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    @staticmethod
    def intent_annotation(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Intent Classification Annotation
        Categorize user intent for query routing and understanding
        """
        text = data.get('text', '')
        annotation_data = {
            'type': 'intent',
            'text': text,
            'primary_intent': data.get('primary_intent', ''),  # search, navigate, purchase, inquire
            'secondary_intents': data.get('secondary_intents', []),
            'domain': data.get('domain', ''),  # e-commerce, support, information
            'confidence': data.get('confidence', 0.0),
            'entities': data.get('entities', []),
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    @staticmethod
    def semantic_annotation(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Semantic Tagging Annotation
        Tag concepts, topics, and key phrases for search relevance
        """
        text = data.get('text', '')
        annotation_data = {
            'type': 'semantic',
            'text': text,
            'concepts': data.get('concepts', []),  # main topics/concepts
            'key_phrases': data.get('key_phrases', []),
            'categories': data.get('categories', []),
            'relationships': data.get('relationships', []),  # concept relationships
            'metadata': data.get('metadata', {}),
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    @staticmethod
    def named_entity_annotation(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Named Entity Recognition (NER) Annotation
        Detect and classify named entities in text
        """
        text = data.get('text', '')
        annotation_data = {
            'type': 'named_entity',
            'text': text,
            'entities': data.get('entities', []),
            # Entity format: {text: str, label: str, start: int, end: int}
            # Labels: PERSON, ORGANIZATION, LOCATION, DATE, TIME, MONEY, PERCENT, etc.
            'entity_types': data.get('entity_types', ['PERSON', 'ORG', 'GPE', 'DATE', 'MONEY']),
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    # AUDIO ANNOTATION TYPES
    @staticmethod
    def audio_transcription(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Audio Transcription Annotation
        Convert speech to text with timestamps
        """
        annotation_data = {
            'type': 'audio_transcription',
            'audio_file': data.get('audio_file', ''),
            'transcription': data.get('transcription', ''),
            'language': data.get('language', 'en'),
            'timestamps': data.get('timestamps', []),  # {start: float, end: float, text: str}
            'speaker_labels': data.get('speaker_labels', []),
            'confidence': data.get('confidence', 0.0),
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    @staticmethod
    def audio_classification(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Audio Event Classification
        Classify sounds, emotions, speaker characteristics
        """
        annotation_data = {
            'type': 'audio_classification',
            'audio_file': data.get('audio_file', ''),
            'classification': data.get('classification', ''),
            'emotion': data.get('emotion', ''),  # happy, sad, angry, neutral
            'speaker_id': data.get('speaker_id', ''),
            'gender': data.get('gender', ''),
            'age_group': data.get('age_group', ''),
            'accent': data.get('accent', ''),
            'background_noise': data.get('background_noise', 'clean'),
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    # IMAGE ANNOTATION TYPES
    @staticmethod
    def image_bounding_box(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Bounding Box Annotation for Object Detection
        """
        annotation_data = {
            'type': 'bounding_box',
            'image_file': data.get('image_file', ''),
            'boxes': data.get('boxes', []),
            # Box format: {x: float, y: float, width: float, height: float, label: str, confidence: float}
            'image_width': data.get('image_width', 0),
            'image_height': data.get('image_height', 0),
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    @staticmethod
    def image_segmentation(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Semantic/Instance Segmentation Annotation
        Pixel-level annotation for precise object boundaries
        """
        annotation_data = {
            'type': 'segmentation',
            'image_file': data.get('image_file', ''),
            'segments': data.get('segments', []),
            # Segment format: {polygon: [], label: str, area: float}
            'segmentation_type': data.get('segmentation_type', 'instance'),  # semantic, instance, panoptic
            'image_width': data.get('image_width', 0),
            'image_height': data.get('image_height', 0),
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    @staticmethod
    def image_classification(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Image Classification Annotation
        Assign categories/labels to entire images
        """
        annotation_data = {
            'type': 'image_classification',
            'image_file': data.get('image_file', ''),
            'primary_label': data.get('primary_label', ''),
            'secondary_labels': data.get('secondary_labels', []),
            'attributes': data.get('attributes', {}),  # color, size, quality, etc.
            'confidence': data.get('confidence', 0.0),
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    # VIDEO ANNOTATION TYPES
    @staticmethod
    def video_object_tracking(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Video Object Tracking Annotation
        Track objects across frames
        """
        annotation_data = {
            'type': 'video_tracking',
            'video_file': data.get('video_file', ''),
            'tracks': data.get('tracks', []),
            # Track format: {object_id: str, frames: [{frame: int, box: {}, label: str}]}
            'fps': data.get('fps', 30),
            'total_frames': data.get('total_frames', 0),
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    @staticmethod
    def video_action_recognition(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Video Action/Activity Recognition
        Identify actions and activities in video clips
        """
        annotation_data = {
            'type': 'video_action',
            'video_file': data.get('video_file', ''),
            'actions': data.get('actions', []),
            # Action format: {start_frame: int, end_frame: int, action: str, confidence: float}
            'scene_description': data.get('scene_description', ''),
            'objects_present': data.get('objects_present', []),
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    # MULTIMODAL ANNOTATION
    @staticmethod
    def multimodal_annotation(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Multimodal Annotation
        Combine multiple data types (text + image + audio)
        """
        annotation_data = {
            'type': 'multimodal',
            'modalities': data.get('modalities', []),  # ['text', 'image', 'audio']
            'text_data': data.get('text_data', {}),
            'image_data': data.get('image_data', {}),
            'audio_data': data.get('audio_data', {}),
            'video_data': data.get('video_data', {}),
            'cross_modal_relationships': data.get('relationships', []),
            'primary_modality': data.get('primary_modality', 'text'),
            'annotated_at': datetime.utcnow().isoformat()
        }
        return annotation_data
    
    # UTILITY METHODS
    @staticmethod
    def get_annotation_types() -> List[Dict[str, Any]]:
        """Get all supported annotation types"""
        return [
            {
                'category': 'Text Annotation',
                'types': [
                    {'name': 'Sentiment Analysis', 'id': 'sentiment', 'description': 'Assess emotions and opinions'},
                    {'name': 'Intent Classification', 'id': 'intent', 'description': 'Categorize user intent'},
                    {'name': 'Semantic Tagging', 'id': 'semantic', 'description': 'Tag concepts and key phrases'},
                    {'name': 'Named Entity Recognition', 'id': 'ner', 'description': 'Detect persons, organizations, locations'}
                ]
            },
            {
                'category': 'Audio Annotation',
                'types': [
                    {'name': 'Transcription', 'id': 'audio_transcription', 'description': 'Convert speech to text'},
                    {'name': 'Audio Classification', 'id': 'audio_classification', 'description': 'Classify sounds and emotions'}
                ]
            },
            {
                'category': 'Image Annotation',
                'types': [
                    {'name': 'Bounding Box', 'id': 'bounding_box', 'description': 'Object detection with boxes'},
                    {'name': 'Segmentation', 'id': 'segmentation', 'description': 'Pixel-level annotation'},
                    {'name': 'Image Classification', 'id': 'image_classification', 'description': 'Categorize images'}
                ]
            },
            {
                'category': 'Video Annotation',
                'types': [
                    {'name': 'Object Tracking', 'id': 'video_tracking', 'description': 'Track objects across frames'},
                    {'name': 'Action Recognition', 'id': 'video_action', 'description': 'Identify actions and activities'}
                ]
            },
            {
                'category': 'Multimodal',
                'types': [
                    {'name': 'Multimodal Annotation', 'id': 'multimodal', 'description': 'Combine multiple data types'}
                ]
            }
        ]
    
    @staticmethod
    def create_annotation_with_type(
        db: Session,
        task_id: int,
        user_id: int,
        annotation_type: str,
        data: Dict[str, Any],
        label_ids: List[int] = []
    ) -> models.Annotation:
        """Create annotation with specific type"""
        
        # Process based on annotation type
        type_handlers = {
            'sentiment': AnnotationTypeService.sentiment_annotation,
            'intent': AnnotationTypeService.intent_annotation,
            'semantic': AnnotationTypeService.semantic_annotation,
            'ner': AnnotationTypeService.named_entity_annotation,
            'audio_transcription': AnnotationTypeService.audio_transcription,
            'audio_classification': AnnotationTypeService.audio_classification,
            'bounding_box': AnnotationTypeService.image_bounding_box,
            'segmentation': AnnotationTypeService.image_segmentation,
            'image_classification': AnnotationTypeService.image_classification,
            'video_tracking': AnnotationTypeService.video_object_tracking,
            'video_action': AnnotationTypeService.video_action_recognition,
            'multimodal': AnnotationTypeService.multimodal_annotation
        }
        
        handler = type_handlers.get(annotation_type)
        if handler:
            annotation_content = handler(db, data)
        else:
            annotation_content = {
                'type': 'generic',
                'data': data,
                'annotated_at': datetime.utcnow().isoformat()
            }
        
        # Create annotation in database
        db_annotation = models.Annotation(
            task_id=task_id,
            user_id=user_id,
            content=json.dumps(annotation_content)
        )
        db.add(db_annotation)
        db.flush()
        
        # Add labels
        for label_id in label_ids:
            annotation_label = models.AnnotationLabel(
                annotation_id=db_annotation.annotation_id,
                label_id=label_id
            )
            db.add(annotation_label)
        
        db.commit()
        db.refresh(db_annotation)
        
        return db_annotation
