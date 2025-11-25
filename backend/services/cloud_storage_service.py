"""
AWS S3 Cloud Storage Service
Handles file upload/download to AWS S3, Google Cloud Storage, and Supabase
"""
import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import mimetypes


class S3StorageService:
    """Service for AWS S3 cloud storage operations"""
    
    def __init__(
        self,
        aws_access_key_id: Optional[str] = None,
        aws_secret_access_key: Optional[str] = None,
        region_name: str = 'us-east-1',
        bucket_name: Optional[str] = None
    ):
        """
        Initialize S3 client
        
        Args:
            aws_access_key_id: AWS access key (or from env AWS_ACCESS_KEY_ID)
            aws_secret_access_key: AWS secret key (or from env AWS_SECRET_ACCESS_KEY)
            region_name: AWS region
            bucket_name: S3 bucket name (or from env S3_BUCKET_NAME)
        """
        self.aws_access_key_id = aws_access_key_id or os.getenv('AWS_ACCESS_KEY_ID')
        self.aws_secret_access_key = aws_secret_access_key or os.getenv('AWS_SECRET_ACCESS_KEY')
        self.region_name = region_name or os.getenv('AWS_REGION', 'us-east-1')
        self.bucket_name = bucket_name or os.getenv('S3_BUCKET_NAME')
        
        if not self.aws_access_key_id or not self.aws_secret_access_key:
            raise ValueError("AWS credentials not provided. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
        
        if not self.bucket_name:
            raise ValueError("S3 bucket name not provided. Set S3_BUCKET_NAME")
        
        # Initialize S3 client
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=self.aws_access_key_id,
            aws_secret_access_key=self.aws_secret_access_key,
            region_name=self.region_name
        )
    
    def upload_file(
        self,
        file_path: str,
        object_name: Optional[str] = None,
        folder: str = 'datasets',
        extra_args: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Upload a file to S3
        
        Args:
            file_path: Path to file to upload
            object_name: S3 object name (if None, uses file basename)
            folder: Folder/prefix in S3 bucket
            extra_args: Extra arguments for S3 upload (e.g., metadata, ACL)
        
        Returns:
            Dict with upload result and S3 URL
        """
        if object_name is None:
            object_name = os.path.basename(file_path)
        
        # Add folder prefix
        s3_key = f"{folder}/{object_name}" if folder else object_name
        
        # Determine content type
        content_type, _ = mimetypes.guess_type(file_path)
        
        # Set default extra args
        if extra_args is None:
            extra_args = {}
        
        if content_type:
            extra_args['ContentType'] = content_type
        
        try:
            # Upload file
            self.s3_client.upload_file(
                file_path,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )
            
            # Generate URL
            s3_url = f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/{s3_key}"
            
            return {
                'success': True,
                'bucket': self.bucket_name,
                's3_key': s3_key,
                's3_url': s3_url,
                'object_name': object_name,
                'size': os.path.getsize(file_path)
            }
            
        except FileNotFoundError:
            return {'success': False, 'error': 'File not found'}
        except NoCredentialsError:
            return {'success': False, 'error': 'AWS credentials not available'}
        except ClientError as e:
            return {'success': False, 'error': str(e)}
    
    def upload_fileobj(
        self,
        file_obj,
        object_name: str,
        folder: str = 'datasets',
        extra_args: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Upload a file-like object to S3
        
        Args:
            file_obj: File-like object (e.g., BytesIO, UploadFile)
            object_name: S3 object name
            folder: Folder/prefix in S3 bucket
            extra_args: Extra arguments for S3 upload
        
        Returns:
            Dict with upload result and S3 URL
        """
        s3_key = f"{folder}/{object_name}" if folder else object_name
        
        # Set default extra args
        if extra_args is None:
            extra_args = {}
        
        # Guess content type from filename
        content_type, _ = mimetypes.guess_type(object_name)
        if content_type:
            extra_args['ContentType'] = content_type
        
        try:
            # Upload file object
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )
            
            s3_url = f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/{s3_key}"
            
            return {
                'success': True,
                'bucket': self.bucket_name,
                's3_key': s3_key,
                's3_url': s3_url,
                'object_name': object_name
            }
            
        except ClientError as e:
            return {'success': False, 'error': str(e)}
    
    def download_file(
        self,
        s3_key: str,
        local_path: str
    ) -> Dict[str, Any]:
        """
        Download a file from S3
        
        Args:
            s3_key: S3 object key
            local_path: Local path to save file
        
        Returns:
            Dict with download result
        """
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            # Download file
            self.s3_client.download_file(
                self.bucket_name,
                s3_key,
                local_path
            )
            
            return {
                'success': True,
                's3_key': s3_key,
                'local_path': local_path,
                'size': os.path.getsize(local_path)
            }
            
        except ClientError as e:
            return {'success': False, 'error': str(e)}
    
    def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600,
        http_method: str = 'get_object'
    ) -> Optional[str]:
        """
        Generate a presigned URL for temporary access to S3 object
        
        Args:
            s3_key: S3 object key
            expiration: URL expiration time in seconds (default 1 hour)
            http_method: HTTP method ('get_object', 'put_object')
        
        Returns:
            Presigned URL string or None if error
        """
        try:
            url = self.s3_client.generate_presigned_url(
                http_method,
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            print(f"Error generating presigned URL: {e}")
            return None
    
    def delete_file(self, s3_key: str) -> Dict[str, Any]:
        """
        Delete a file from S3
        
        Args:
            s3_key: S3 object key
        
        Returns:
            Dict with deletion result
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            return {
                'success': True,
                's3_key': s3_key,
                'message': 'File deleted successfully'
            }
            
        except ClientError as e:
            return {'success': False, 'error': str(e)}
    
    def list_files(
        self,
        folder: str = 'datasets',
        max_keys: int = 1000
    ) -> Dict[str, Any]:
        """
        List files in S3 bucket folder
        
        Args:
            folder: Folder/prefix to list
            max_keys: Maximum number of files to return
        
        Returns:
            Dict with list of files
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=folder,
                MaxKeys=max_keys
            )
            
            files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    files.append({
                        'key': obj['Key'],
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'].isoformat(),
                        'url': f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/{obj['Key']}"
                    })
            
            return {
                'success': True,
                'bucket': self.bucket_name,
                'folder': folder,
                'files': files,
                'count': len(files)
            }
            
        except ClientError as e:
            return {'success': False, 'error': str(e)}
    
    def get_file_metadata(self, s3_key: str) -> Dict[str, Any]:
        """
        Get metadata for an S3 object
        
        Args:
            s3_key: S3 object key
        
        Returns:
            Dict with file metadata
        """
        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            return {
                'success': True,
                's3_key': s3_key,
                'content_type': response.get('ContentType'),
                'size': response.get('ContentLength'),
                'last_modified': response.get('LastModified').isoformat() if response.get('LastModified') else None,
                'etag': response.get('ETag'),
                'metadata': response.get('Metadata', {})
            }
            
        except ClientError as e:
            return {'success': False, 'error': str(e)}


class SupabaseStorageService:
    """Service for Supabase cloud storage operations"""
    
    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        bucket_name: str = 'datasets'
    ):
        """
        Initialize Supabase storage client
        
        Args:
            supabase_url: Supabase project URL (or from env SUPABASE_URL)
            supabase_key: Supabase service key (or from env SUPABASE_KEY)
            bucket_name: Storage bucket name
        """
        self.supabase_url = supabase_url or os.getenv('SUPABASE_URL')
        self.supabase_key = supabase_key or os.getenv('SUPABASE_KEY')
        self.bucket_name = bucket_name
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase credentials not provided. Set SUPABASE_URL and SUPABASE_KEY")
        
        try:
            from supabase import create_client, Client
            self.client: Client = create_client(self.supabase_url, self.supabase_key)
        except ImportError:
            raise ImportError("supabase-py is not installed. Install with: pip install supabase")
    
    def upload_file(
        self,
        file_path: str,
        object_name: Optional[str] = None,
        folder: str = 'datasets'
    ) -> Dict[str, Any]:
        """
        Upload a file to Supabase storage
        
        Args:
            file_path: Path to file to upload
            object_name: Object name in bucket (if None, uses file basename)
            folder: Folder/path in bucket
        
        Returns:
            Dict with upload result and public URL
        """
        if object_name is None:
            object_name = os.path.basename(file_path)
        
        storage_path = f"{folder}/{object_name}" if folder else object_name
        
        try:
            with open(file_path, 'rb') as f:
                response = self.client.storage.from_(self.bucket_name).upload(
                    storage_path,
                    f
                )
            
            # Get public URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(storage_path)
            
            return {
                'success': True,
                'bucket': self.bucket_name,
                'path': storage_path,
                'public_url': public_url,
                'object_name': object_name
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_public_url(self, storage_path: str) -> str:
        """Get public URL for a file in Supabase storage"""
        return self.client.storage.from_(self.bucket_name).get_public_url(storage_path)
    
    def download_file(self, storage_path: str, local_path: str) -> Dict[str, Any]:
        """
        Download a file from Supabase storage
        
        Args:
            storage_path: Path in Supabase storage
            local_path: Local path to save file
        
        Returns:
            Dict with download result
        """
        try:
            response = self.client.storage.from_(self.bucket_name).download(storage_path)
            
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            with open(local_path, 'wb') as f:
                f.write(response)
            
            return {
                'success': True,
                'storage_path': storage_path,
                'local_path': local_path,
                'size': len(response)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
