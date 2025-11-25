"""
Bulk Upload Service
Handles multiple file uploads, ZIP extraction, and batch processing
"""
import os
import zipfile
import shutil
from typing import List, Dict, Any
from fastapi import UploadFile
import mimetypes
from pathlib import Path


class BulkUploadService:
    """Service for handling bulk file uploads and ZIP extraction"""
    
    ALLOWED_EXTENSIONS = {
        'text': ['.txt', '.csv', '.json', '.jsonl', '.xml'],
        'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
        'video': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'],
        'audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
        'document': ['.pdf', '.doc', '.docx', '.odt']
    }
    
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB per file
    MAX_TOTAL_SIZE = 500 * 1024 * 1024  # 500MB total
    
    @staticmethod
    def get_file_type(filename: str) -> str:
        """Determine file type from extension"""
        ext = Path(filename).suffix.lower()
        
        for file_type, extensions in BulkUploadService.ALLOWED_EXTENSIONS.items():
            if ext in extensions:
                return file_type
        
        return 'unknown'
    
    @staticmethod
    def validate_file(file: UploadFile) -> Dict[str, Any]:
        """
        Validate uploaded file
        
        Returns:
            Dict with 'valid' boolean and 'message' string
        """
        # Check file extension
        file_type = BulkUploadService.get_file_type(file.filename)
        if file_type == 'unknown':
            return {
                'valid': False,
                'message': f'Unsupported file type: {Path(file.filename).suffix}'
            }
        
        # Check MIME type
        mime_type, _ = mimetypes.guess_type(file.filename)
        
        return {
            'valid': True,
            'file_type': file_type,
            'mime_type': mime_type,
            'message': 'File is valid'
        }
    
    @staticmethod
    async def upload_multiple_files(
        files: List[UploadFile],
        upload_dir: str = "backend/uploads/datasets"
    ) -> Dict[str, Any]:
        """
        Upload multiple files at once
        
        Args:
            files: List of UploadFile objects
            upload_dir: Directory to save files
        
        Returns:
            Dict with upload results
        """
        os.makedirs(upload_dir, exist_ok=True)
        
        results = {
            'success': [],
            'failed': [],
            'total_files': len(files),
            'total_size': 0
        }
        
        total_size = 0
        
        for file in files:
            try:
                # Validate file
                validation = BulkUploadService.validate_file(file)
                if not validation['valid']:
                    results['failed'].append({
                        'filename': file.filename,
                        'reason': validation['message']
                    })
                    continue
                
                # Read file content
                content = await file.read()
                file_size = len(content)
                
                # Check file size
                if file_size > BulkUploadService.MAX_FILE_SIZE:
                    results['failed'].append({
                        'filename': file.filename,
                        'reason': f'File too large: {file_size / 1024 / 1024:.2f}MB (max 100MB)'
                    })
                    continue
                
                # Check total size
                if total_size + file_size > BulkUploadService.MAX_TOTAL_SIZE:
                    results['failed'].append({
                        'filename': file.filename,
                        'reason': 'Total upload size exceeded (max 500MB)'
                    })
                    continue
                
                # Save file
                file_path = os.path.join(upload_dir, file.filename)
                
                # Handle duplicate filenames
                if os.path.exists(file_path):
                    name, ext = os.path.splitext(file.filename)
                    counter = 1
                    while os.path.exists(file_path):
                        file_path = os.path.join(upload_dir, f"{name}_{counter}{ext}")
                        counter += 1
                
                with open(file_path, "wb") as f:
                    f.write(content)
                
                total_size += file_size
                
                results['success'].append({
                    'filename': file.filename,
                    'saved_as': os.path.basename(file_path),
                    'size': file_size,
                    'file_type': validation['file_type'],
                    'path': file_path
                })
                
            except Exception as e:
                results['failed'].append({
                    'filename': file.filename,
                    'reason': str(e)
                })
        
        results['total_size'] = total_size
        results['success_count'] = len(results['success'])
        results['failed_count'] = len(results['failed'])
        
        return results
    
    @staticmethod
    async def extract_and_upload_zip(
        zip_file: UploadFile,
        upload_dir: str = "backend/uploads/datasets"
    ) -> Dict[str, Any]:
        """
        Extract ZIP file and upload all contents
        
        Args:
            zip_file: ZIP file upload
            upload_dir: Directory to save extracted files
        
        Returns:
            Dict with extraction results
        """
        os.makedirs(upload_dir, exist_ok=True)
        
        results = {
            'success': [],
            'failed': [],
            'total_files': 0,
            'extracted_files': 0
        }
        
        # Create temporary directory for extraction
        temp_dir = os.path.join(upload_dir, 'temp_extract')
        os.makedirs(temp_dir, exist_ok=True)
        
        try:
            # Save ZIP file temporarily
            zip_path = os.path.join(temp_dir, zip_file.filename)
            content = await zip_file.read()
            
            with open(zip_path, "wb") as f:
                f.write(content)
            
            # Extract ZIP
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                file_list = zip_ref.namelist()
                results['total_files'] = len(file_list)
                
                for file_name in file_list:
                    # Skip directories and hidden files
                    if file_name.endswith('/') or file_name.startswith('.'):
                        continue
                    
                    try:
                        # Extract file
                        zip_ref.extract(file_name, temp_dir)
                        extracted_path = os.path.join(temp_dir, file_name)
                        
                        # Validate file type
                        file_type = BulkUploadService.get_file_type(file_name)
                        if file_type == 'unknown':
                            results['failed'].append({
                                'filename': file_name,
                                'reason': 'Unsupported file type'
                            })
                            continue
                        
                        # Move to final location
                        final_filename = os.path.basename(file_name)
                        final_path = os.path.join(upload_dir, final_filename)
                        
                        # Handle duplicates
                        if os.path.exists(final_path):
                            name, ext = os.path.splitext(final_filename)
                            counter = 1
                            while os.path.exists(final_path):
                                final_path = os.path.join(upload_dir, f"{name}_{counter}{ext}")
                                counter += 1
                        
                        shutil.move(extracted_path, final_path)
                        
                        file_size = os.path.getsize(final_path)
                        
                        results['success'].append({
                            'filename': file_name,
                            'saved_as': os.path.basename(final_path),
                            'size': file_size,
                            'file_type': file_type,
                            'path': final_path
                        })
                        
                        results['extracted_files'] += 1
                        
                    except Exception as e:
                        results['failed'].append({
                            'filename': file_name,
                            'reason': str(e)
                        })
            
        except zipfile.BadZipFile:
            return {
                'error': 'Invalid ZIP file',
                'success': [],
                'failed': []
            }
        
        except Exception as e:
            return {
                'error': str(e),
                'success': [],
                'failed': []
            }
        
        finally:
            # Clean up temporary directory
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
        
        return results
    
    @staticmethod
    def get_upload_statistics(upload_dir: str = "backend/uploads/datasets") -> Dict[str, Any]:
        """
        Get statistics about uploaded files
        
        Returns:
            Dict with file counts by type and total size
        """
        if not os.path.exists(upload_dir):
            return {
                'total_files': 0,
                'total_size': 0,
                'by_type': {}
            }
        
        stats = {
            'total_files': 0,
            'total_size': 0,
            'by_type': {}
        }
        
        for root, dirs, files in os.walk(upload_dir):
            for file in files:
                file_path = os.path.join(root, file)
                file_size = os.path.getsize(file_path)
                file_type = BulkUploadService.get_file_type(file)
                
                stats['total_files'] += 1
                stats['total_size'] += file_size
                
                if file_type not in stats['by_type']:
                    stats['by_type'][file_type] = {
                        'count': 0,
                        'size': 0
                    }
                
                stats['by_type'][file_type]['count'] += 1
                stats['by_type'][file_type]['size'] += file_size
        
        return stats
