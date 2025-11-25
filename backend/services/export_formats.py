"""
Advanced Export Format Service
Supports YOLO, Pascal VOC XML, CoNLL, and ZIP packaging
"""
import io
import json
import zipfile
from typing import Dict, List, Any
from sqlalchemy.orm import Session
import xml.etree.ElementTree as ET
from xml.dom import minidom
import models


class YOLOExportService:
    """Export annotations in YOLO format for object detection"""
    
    @staticmethod
    def export_to_yolo(db: Session, project_id: int) -> Dict[str, Any]:
        """
        Export project annotations in YOLO format
        Returns dict with classes.txt and individual annotation files
        
        YOLO format:
        - classes.txt: List of class names (one per line)
        - For each image: <image_name>.txt with format:
          <class_id> <x_center> <y_center> <width> <height> (normalized 0-1)
        """
        project = db.query(models.Project).filter(models.Project.project_id == project_id).first()
        if not project:
            return {"error": "Project not found"}
        
        # Get all tasks for project
        tasks = db.query(models.AnnotationTask).filter(
            models.AnnotationTask.project_id == project_id
        ).all()
        
        # Collect all unique labels
        all_labels = set()
        annotations_by_task = {}
        
        for task in tasks:
            annotations = db.query(models.Annotation).filter(
                models.Annotation.task_id == task.task_id
            ).all()
            
            task_annotations = []
            for ann in annotations:
                # Parse annotation content
                try:
                    content = json.loads(ann.content) if isinstance(ann.content, str) else ann.content
                    
                    # Check if it's a bounding box annotation
                    if content.get('type') == 'bounding_box':
                        # Get labels
                        ann_labels = db.query(models.AnnotationLabel).filter(
                            models.AnnotationLabel.annotation_id == ann.annotation_id
                        ).all()
                        
                        for ann_label in ann_labels:
                            label = db.query(models.Label).filter(
                                models.Label.label_id == ann_label.label_id
                            ).first()
                            if label:
                                all_labels.add(label.label_name)
                                
                                # Extract bounding box coordinates
                                bbox = content.get('bbox', {})
                                task_annotations.append({
                                    'label': label.label_name,
                                    'bbox': bbox,
                                    'image_width': content.get('image_width', 1920),
                                    'image_height': content.get('image_height', 1080)
                                })
                except:
                    continue
            
            if task_annotations:
                annotations_by_task[f"task_{task.task_id}"] = task_annotations
        
        # Create classes.txt content
        class_list = sorted(list(all_labels))
        class_to_id = {label: idx for idx, label in enumerate(class_list)}
        classes_txt = "\n".join(class_list)
        
        # Create YOLO annotation files
        yolo_files = {}
        for task_name, annotations in annotations_by_task.items():
            lines = []
            for ann in annotations:
                class_id = class_to_id[ann['label']]
                bbox = ann['bbox']
                img_w = ann['image_width']
                img_h = ann['image_height']
                
                # Convert to YOLO format (normalized center x, center y, width, height)
                x = bbox.get('x', 0)
                y = bbox.get('y', 0)
                w = bbox.get('width', 0)
                h = bbox.get('height', 0)
                
                # Calculate center and normalize
                x_center = (x + w / 2) / img_w
                y_center = (y + h / 2) / img_h
                width_norm = w / img_w
                height_norm = h / img_h
                
                lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {width_norm:.6f} {height_norm:.6f}")
            
            yolo_files[f"{task_name}.txt"] = "\n".join(lines)
        
        return {
            "format": "YOLO",
            "project_name": project.project_name,
            "classes_txt": classes_txt,
            "num_classes": len(class_list),
            "annotation_files": yolo_files,
            "total_annotations": sum(len(anns) for anns in annotations_by_task.values())
        }


class PascalVOCExportService:
    """Export annotations in Pascal VOC XML format"""
    
    @staticmethod
    def export_to_voc(db: Session, project_id: int) -> Dict[str, Any]:
        """
        Export project annotations in Pascal VOC XML format
        Returns dict with XML files for each image
        
        Pascal VOC format:
        - XML file per image with bounding boxes and labels
        """
        project = db.query(models.Project).filter(models.Project.project_id == project_id).first()
        if not project:
            return {"error": "Project not found"}
        
        # Get all tasks for project
        tasks = db.query(models.AnnotationTask).filter(
            models.AnnotationTask.project_id == project_id
        ).all()
        
        xml_files = {}
        
        for task in tasks:
            annotations = db.query(models.Annotation).filter(
                models.Annotation.task_id == task.task_id
            ).all()
            
            if not annotations:
                continue
            
            # Create XML root
            annotation_elem = ET.Element('annotation')
            
            # Add folder
            folder = ET.SubElement(annotation_elem, 'folder')
            folder.text = project.project_name
            
            # Add filename
            filename = ET.SubElement(annotation_elem, 'filename')
            filename.text = f"task_{task.task_id}.jpg"
            
            # Add source
            source = ET.SubElement(annotation_elem, 'source')
            database = ET.SubElement(source, 'database')
            database.text = 'AI Annotation Platform'
            
            # Default image size (can be overridden by actual data)
            img_width = 1920
            img_height = 1080
            img_depth = 3
            
            # Process annotations
            for ann in annotations:
                try:
                    content = json.loads(ann.content) if isinstance(ann.content, str) else ann.content
                    
                    if content.get('type') == 'bounding_box':
                        # Update image size if provided
                        img_width = content.get('image_width', img_width)
                        img_height = content.get('image_height', img_height)
                        
                        # Get labels
                        ann_labels = db.query(models.AnnotationLabel).filter(
                            models.AnnotationLabel.annotation_id == ann.annotation_id
                        ).all()
                        
                        for ann_label in ann_labels:
                            label = db.query(models.Label).filter(
                                models.Label.label_id == ann_label.label_id
                            ).first()
                            
                            if label:
                                # Create object element
                                obj = ET.SubElement(annotation_elem, 'object')
                                
                                name = ET.SubElement(obj, 'name')
                                name.text = label.label_name
                                
                                pose = ET.SubElement(obj, 'pose')
                                pose.text = 'Unspecified'
                                
                                truncated = ET.SubElement(obj, 'truncated')
                                truncated.text = '0'
                                
                                difficult = ET.SubElement(obj, 'difficult')
                                difficult.text = '0'
                                
                                # Bounding box
                                bbox = content.get('bbox', {})
                                bndbox = ET.SubElement(obj, 'bndbox')
                                
                                xmin = ET.SubElement(bndbox, 'xmin')
                                xmin.text = str(int(bbox.get('x', 0)))
                                
                                ymin = ET.SubElement(bndbox, 'ymin')
                                ymin.text = str(int(bbox.get('y', 0)))
                                
                                xmax = ET.SubElement(bndbox, 'xmax')
                                xmax.text = str(int(bbox.get('x', 0) + bbox.get('width', 0)))
                                
                                ymax = ET.SubElement(bndbox, 'ymax')
                                ymax.text = str(int(bbox.get('y', 0) + bbox.get('height', 0)))
                except:
                    continue
            
            # Add size element
            size = ET.SubElement(annotation_elem, 'size')
            width = ET.SubElement(size, 'width')
            width.text = str(img_width)
            height = ET.SubElement(size, 'height')
            height.text = str(img_height)
            depth = ET.SubElement(size, 'depth')
            depth.text = str(img_depth)
            
            # Add segmented
            segmented = ET.SubElement(annotation_elem, 'segmented')
            segmented.text = '0'
            
            # Convert to pretty XML string
            xml_str = minidom.parseString(ET.tostring(annotation_elem)).toprettyxml(indent="  ")
            xml_files[f"task_{task.task_id}.xml"] = xml_str
        
        return {
            "format": "Pascal VOC",
            "project_name": project.project_name,
            "xml_files": xml_files,
            "total_files": len(xml_files)
        }


class CoNLLExportService:
    """Export NLP annotations in CoNLL format"""
    
    @staticmethod
    def export_to_conll(db: Session, project_id: int) -> Dict[str, Any]:
        """
        Export project annotations in CoNLL format for NER
        
        CoNLL format:
        Token    POS    Chunk    NER
        word1    NN     B-NP     B-PER
        word2    VB     B-VP     O
        """
        project = db.query(models.Project).filter(models.Project.project_id == project_id).first()
        if not project:
            return {"error": "Project not found"}
        
        tasks = db.query(models.AnnotationTask).filter(
            models.AnnotationTask.project_id == project_id
        ).all()
        
        conll_lines = []
        
        for task in tasks:
            annotations = db.query(models.Annotation).filter(
                models.Annotation.task_id == task.task_id
            ).all()
            
            for ann in annotations:
                try:
                    content = json.loads(ann.content) if isinstance(ann.content, str) else ann.content
                    
                    # Handle NER annotations
                    if content.get('type') == 'ner' or content.get('annotation_type') == 'ner':
                        entities = content.get('entities', [])
                        text = content.get('text', '')
                        
                        if text and entities:
                            # Simple tokenization
                            tokens = text.split()
                            labels = ['O'] * len(tokens)
                            
                            # Map entities to tokens (simplified)
                            for entity in entities:
                                entity_type = entity.get('type', 'ENTITY')
                                # Mark tokens (simplified - in production use proper span matching)
                                labels[0] = f"B-{entity_type}"  # Beginning
                                for i in range(1, min(len(tokens), 3)):
                                    labels[i] = f"I-{entity_type}"  # Inside
                            
                            # Write CoNLL format
                            for token, label in zip(tokens, labels):
                                conll_lines.append(f"{token}\t{label}")
                            conll_lines.append("")  # Empty line between sentences
                except:
                    continue
        
        conll_text = "\n".join(conll_lines)
        
        return {
            "format": "CoNLL",
            "project_name": project.project_name,
            "conll_data": conll_text,
            "total_lines": len(conll_lines)
        }


class ZIPExportService:
    """Create ZIP archives of exported data"""
    
    @staticmethod
    def create_zip(files_dict: Dict[str, str], project_name: str) -> bytes:
        """
        Create a ZIP file from a dictionary of filename -> content
        
        Args:
            files_dict: Dictionary mapping filenames to their content
            project_name: Name of the project (used for folder name)
        
        Returns:
            Bytes of the ZIP file
        """
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for filename, content in files_dict.items():
                # Add file to ZIP with project folder structure
                arcname = f"{project_name}/{filename}"
                
                if isinstance(content, str):
                    zip_file.writestr(arcname, content)
                elif isinstance(content, bytes):
                    zip_file.writestr(arcname, content)
        
        zip_buffer.seek(0)
        return zip_buffer.getvalue()
    
    @staticmethod
    def export_project_as_zip(db: Session, project_id: int, export_format: str = 'all') -> bytes:
        """
        Export entire project as ZIP with multiple formats
        
        Args:
            db: Database session
            project_id: Project ID to export
            export_format: 'yolo', 'voc', 'coco', 'jsonl', 'csv', 'conll', or 'all'
        
        Returns:
            ZIP file bytes
        """
        from services.advanced_features import ExportService
        
        project = db.query(models.Project).filter(models.Project.project_id == project_id).first()
        if not project:
            raise ValueError("Project not found")
        
        project_name = project.project_name.replace(" ", "_")
        files_dict = {}
        
        # Add different formats based on request
        if export_format in ['yolo', 'all']:
            yolo_data = YOLOExportService.export_to_yolo(db, project_id)
            if 'classes_txt' in yolo_data:
                files_dict['yolo/classes.txt'] = yolo_data['classes_txt']
                for filename, content in yolo_data.get('annotation_files', {}).items():
                    files_dict[f'yolo/{filename}'] = content
        
        if export_format in ['voc', 'all']:
            voc_data = PascalVOCExportService.export_to_voc(db, project_id)
            for filename, content in voc_data.get('xml_files', {}).items():
                files_dict[f'voc/{filename}'] = content
        
        if export_format in ['coco', 'all']:
            coco_data = ExportService.export_to_coco(db, project_id)
            files_dict['coco/annotations.json'] = json.dumps(coco_data, indent=2)
        
        if export_format in ['jsonl', 'all']:
            jsonl_data = ExportService.export_to_jsonl(db, project_id)
            files_dict['jsonl/annotations.jsonl'] = jsonl_data
        
        if export_format in ['csv', 'all']:
            csv_data = ExportService.export_to_csv(db, project_id)
            files_dict['csv/annotations.csv'] = csv_data
        
        if export_format in ['conll', 'all']:
            conll_data = CoNLLExportService.export_to_conll(db, project_id)
            if 'conll_data' in conll_data:
                files_dict['conll/annotations.conll'] = conll_data['conll_data']
        
        # Add README
        readme = f"""# {project.project_name} - Exported Annotations

Project ID: {project_id}
Export Date: {models.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

## Formats Included:

"""
        if 'yolo' in files_dict or export_format == 'all':
            readme += "- **YOLO**: Object detection format (yolo/ folder)\n"
        if 'voc' in files_dict or export_format == 'all':
            readme += "- **Pascal VOC**: XML format for object detection (voc/ folder)\n"
        if 'coco' in files_dict or export_format == 'all':
            readme += "- **COCO**: JSON format for object detection (coco/ folder)\n"
        if 'jsonl' in files_dict or export_format == 'all':
            readme += "- **JSONL**: Line-delimited JSON for NLP (jsonl/ folder)\n"
        if 'csv' in files_dict or export_format == 'all':
            readme += "- **CSV**: Comma-separated values (csv/ folder)\n"
        if 'conll' in files_dict or export_format == 'all':
            readme += "- **CoNLL**: Named Entity Recognition format (conll/ folder)\n"
        
        readme += "\n## Generated by AI Annotation Platform\n"
        files_dict['README.md'] = readme
        
        return ZIPExportService.create_zip(files_dict, project_name)
