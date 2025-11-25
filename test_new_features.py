"""
Test Script for New Features
Tests all 5 newly implemented features
"""
import requests
import json
import os

BASE_URL = "http://127.0.0.1:8000"

def print_result(test_name, success, message=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} - {test_name}")
    if message:
        print(f"   {message}")
    print()

def test_export_formats():
    """Test YOLO, VOC, CoNLL exports"""
    print("=" * 50)
    print("TESTING EXPORT FORMATS")
    print("=" * 50)
    
    # Test YOLO export
    try:
        response = requests.get(f"{BASE_URL}/api/export/yolo/1")
        success = response.status_code == 200 and 'format' in response.json()
        print_result("YOLO Export", success, f"Status: {response.status_code}")
    except Exception as e:
        print_result("YOLO Export", False, str(e))
    
    # Test VOC export
    try:
        response = requests.get(f"{BASE_URL}/api/export/voc/1")
        success = response.status_code == 200 and 'format' in response.json()
        print_result("Pascal VOC Export", success, f"Status: {response.status_code}")
    except Exception as e:
        print_result("Pascal VOC Export", False, str(e))
    
    # Test CoNLL export
    try:
        response = requests.get(f"{BASE_URL}/api/export/conll/1")
        success = response.status_code == 200 and 'format' in response.json()
        print_result("CoNLL Export", success, f"Status: {response.status_code}")
    except Exception as e:
        print_result("CoNLL Export", False, str(e))
    
    # Test ZIP export
    try:
        response = requests.get(f"{BASE_URL}/api/export/zip/1?format=all")
        success = response.status_code == 200 and response.headers.get('content-type') == 'application/zip'
        print_result("ZIP Export", success, f"Status: {response.status_code}")
    except Exception as e:
        print_result("ZIP Export", False, str(e))

def test_bulk_upload():
    """Test bulk upload and ZIP extraction"""
    print("=" * 50)
    print("TESTING BULK UPLOAD")
    print("=" * 50)
    
    # Test upload stats endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/datasets/upload-stats")
        success = response.status_code == 200
        data = response.json()
        print_result("Upload Statistics", success, f"Total files: {data.get('total_files', 0)}")
    except Exception as e:
        print_result("Upload Statistics", False, str(e))
    
    # Test bulk upload endpoint exists
    try:
        # Just test if endpoint responds (don't upload files in test)
        response = requests.post(f"{BASE_URL}/api/datasets/bulk-upload", files={})
        # 422 is expected (validation error for empty files)
        success = response.status_code in [200, 422]
        print_result("Bulk Upload Endpoint", success, f"Status: {response.status_code}")
    except Exception as e:
        print_result("Bulk Upload Endpoint", False, str(e))

def test_cloud_storage():
    """Test S3 cloud storage (requires configuration)"""
    print("=" * 50)
    print("TESTING CLOUD STORAGE")
    print("=" * 50)
    
    # Check if S3 is configured
    is_configured = os.getenv('AWS_ACCESS_KEY_ID') and os.getenv('S3_BUCKET_NAME')
    
    if not is_configured:
        print_result("S3 Configuration", False, "AWS credentials not configured in .env")
        print("   To enable: Add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME to .env")
        return
    
    # Test S3 list endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/cloud-storage/s3/list?folder=datasets")
        success = response.status_code == 200
        data = response.json()
        print_result("S3 List Files", success, f"Found {data.get('count', 0)} files")
    except Exception as e:
        print_result("S3 List Files", False, str(e))

def test_oauth():
    """Test OAuth providers"""
    print("=" * 50)
    print("TESTING OAUTH AUTHENTICATION")
    print("=" * 50)
    
    # Test providers endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/auth/oauth/providers")
        success = response.status_code == 200 and 'providers' in response.json()
        data = response.json()
        providers = data.get('providers', [])
        
        google_enabled = any(p['name'] == 'google' and p['enabled'] for p in providers)
        github_enabled = any(p['name'] == 'github' and p['enabled'] for p in providers)
        
        print_result("OAuth Providers Endpoint", success)
        print_result("Google OAuth Configured", google_enabled, 
                    "Not configured" if not google_enabled else "Ready")
        print_result("GitHub OAuth Configured", github_enabled,
                    "Not configured" if not github_enabled else "Ready")
        
        if not google_enabled and not github_enabled:
            print("   To enable: Add GOOGLE_CLIENT_ID/SECRET or GITHUB_CLIENT_ID/SECRET to .env")
    except Exception as e:
        print_result("OAuth Providers Endpoint", False, str(e))

def test_ocr():
    """Test OCR features (requires Tesseract)"""
    print("=" * 50)
    print("TESTING OCR")
    print("=" * 50)
    
    # Test supported languages endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/ocr/languages")
        success = response.status_code == 200
        data = response.json()
        tesseract_installed = data.get('tesseract_installed', False)
        languages = data.get('languages', [])
        
        print_result("OCR Languages Endpoint", success)
        print_result("Tesseract Installed", tesseract_installed,
                    f"Supports {len(languages)} languages" if tesseract_installed else "Not installed")
        
        if not tesseract_installed:
            print("   To enable: Install Tesseract OCR on your system")
            print("   Windows: https://github.com/UB-Mannheim/tesseract/wiki")
            print("   Linux: sudo apt-get install tesseract-ocr")
            print("   Mac: brew install tesseract")
    except Exception as e:
        print_result("OCR Languages Endpoint", False, str(e))

def test_all_features():
    """Run all feature tests"""
    print("\n")
    print("🚀 TESTING ALL NEW FEATURES")
    print("=" * 50)
    print()
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code != 200:
            print("❌ Backend is not running at", BASE_URL)
            print("   Start the backend with: python backend/main.py")
            return
        print("✅ Backend is running\n")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend at", BASE_URL)
        print("   Start the backend with: python backend/main.py")
        return
    
    # Run tests
    test_export_formats()
    test_bulk_upload()
    test_cloud_storage()
    test_oauth()
    test_ocr()
    
    print("=" * 50)
    print("✅ TESTING COMPLETE")
    print("=" * 50)
    print("\n📚 For detailed documentation, see:")
    print("   - NEW_FEATURES_GUIDE.md (complete guide)")
    print("   - NEW_FEATURES_SUMMARY.md (quick summary)")
    print("   - .env.example (configuration template)")
    print()

if __name__ == "__main__":
    test_all_features()
