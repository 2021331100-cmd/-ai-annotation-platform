"""
Comprehensive test script to verify all platform functionality
Tests API endpoints, database relationships, and role-based access
"""
import requests
import json
from datetime import datetime, date

BASE_URL = "http://localhost:8000/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")

def print_section(title):
    print(f"\n{Colors.YELLOW}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}{title}{Colors.END}")
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}")

# Test data
test_users = {}
test_projects = {}
test_datasets = {}
test_labels = {}
test_tasks = {}
test_assignments = {}
test_annotations = {}
test_reviews = {}

def test_authentication():
    """Test user registration and login"""
    print_section("1. AUTHENTICATION TESTS")
    
    # Test signup
    users_to_create = [
        {"username": "admin_test", "email": "admin@test.com", "password": "admin123", "role": "Admin"},
        {"username": "manager_test", "email": "manager@test.com", "password": "manager123", "role": "Manager"},
        {"username": "annotator_test", "email": "annotator@test.com", "password": "annotator123", "role": "Annotator"},
        {"username": "reviewer_test", "email": "reviewer@test.com", "password": "reviewer123", "role": "Reviewer"}
    ]
    
    for user_data in users_to_create:
        try:
            response = requests.post(f"{BASE_URL}/auth/signup", json=user_data)
            if response.status_code in [200, 201]:
                test_users[user_data['role']] = response.json()
                print_success(f"Created {user_data['role']} user: {user_data['username']}")
            elif response.status_code == 400 and "already registered" in response.text.lower():
                print_info(f"{user_data['role']} user already exists")
                # Try to login to get user info
                login_response = requests.post(
                    f"{BASE_URL}/auth/login",
                    data={"username": user_data['username'], "password": user_data['password']},
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                if login_response.status_code == 200:
                    token = login_response.json()['access_token']
                    # Get user info
                    users_response = requests.get(f"{BASE_URL}/users/", headers={"Authorization": f"Bearer {token}"})
                    if users_response.status_code == 200:
                        users = users_response.json()
                        user_found = next((u for u in users if u['username'] == user_data['username']), None)
                        if user_found:
                            test_users[user_data['role']] = user_found
        except Exception as e:
            print_error(f"Error creating {user_data['role']}: {str(e)}")
    
    # Test login for each user
    print()
    for role, user_data in [("Admin", users_to_create[0]), ("Manager", users_to_create[1])]:
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                data={"username": user_data['username'], "password": user_data['password']},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            if response.status_code == 200:
                print_success(f"Login successful for {role}")
            else:
                print_error(f"Login failed for {role}: {response.status_code}")
        except Exception as e:
            print_error(f"Login error for {role}: {str(e)}")

def test_projects(token):
    """Test project management"""
    print_section("2. PROJECT MANAGEMENT TESTS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create project
    project_data = {
        "project_name": "Test Annotation Project",
        "description": "Test project for annotation platform",
        "status": "Active"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/projects/", json=project_data, headers=headers)
        if response.status_code in [200, 201]:
            test_projects['main'] = response.json()
            print_success(f"Created project: {test_projects['main']['project_name']}")
        else:
            print_error(f"Failed to create project: {response.status_code}")
    except Exception as e:
        print_error(f"Project creation error: {str(e)}")
    
    # List projects
    try:
        response = requests.get(f"{BASE_URL}/projects/", headers=headers)
        if response.status_code == 200:
            projects = response.json()
            print_success(f"Retrieved {len(projects)} projects")
        else:
            print_error(f"Failed to list projects: {response.status_code}")
    except Exception as e:
        print_error(f"Project list error: {str(e)}")

def test_datasets(token):
    """Test dataset management"""
    print_section("3. DATASET MANAGEMENT TESTS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create dataset
    dataset_data = {
        "dataset_name": "Test Dataset",
        "description": "Test dataset for annotations",
        "format": "CSV"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/datasets/", json=dataset_data, headers=headers)
        if response.status_code in [200, 201]:
            test_datasets['main'] = response.json()
            print_success(f"Created dataset: {test_datasets['main']['dataset_name']}")
        else:
            print_error(f"Failed to create dataset: {response.status_code}")
    except Exception as e:
        print_error(f"Dataset creation error: {str(e)}")
    
    # List datasets
    try:
        response = requests.get(f"{BASE_URL}/datasets/", headers=headers)
        if response.status_code == 200:
            datasets = response.json()
            print_success(f"Retrieved {len(datasets)} datasets")
        else:
            print_error(f"Failed to list datasets: {response.status_code}")
    except Exception as e:
        print_error(f"Dataset list error: {str(e)}")

def test_labels(token):
    """Test label management"""
    print_section("4. LABEL MANAGEMENT TESTS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create labels
    labels_data = [
        {"label_name": "Positive", "description": "Positive sentiment", "color_code": "#4caf50"},
        {"label_name": "Negative", "description": "Negative sentiment", "color_code": "#f44336"},
        {"label_name": "Neutral", "description": "Neutral sentiment", "color_code": "#ff9800"}
    ]
    
    for label_data in labels_data:
        try:
            response = requests.post(f"{BASE_URL}/labels/", json=label_data, headers=headers)
            if response.status_code in [200, 201]:
                test_labels[label_data['label_name']] = response.json()
                print_success(f"Created label: {label_data['label_name']}")
            else:
                print_error(f"Failed to create label {label_data['label_name']}: {response.status_code}")
        except Exception as e:
            print_error(f"Label creation error: {str(e)}")
    
    # List labels
    try:
        response = requests.get(f"{BASE_URL}/labels/", headers=headers)
        if response.status_code == 200:
            labels = response.json()
            print_success(f"Retrieved {len(labels)} labels")
        else:
            print_error(f"Failed to list labels: {response.status_code}")
    except Exception as e:
        print_error(f"Label list error: {str(e)}")

def test_tasks(token):
    """Test task creation and management"""
    print_section("5. TASK MANAGEMENT TESTS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    if not test_projects.get('main') or not test_datasets.get('main'):
        print_error("Missing project or dataset for task creation")
        return
    
    # Create task
    task_data = {
        "project_id": test_projects['main']['project_id'],
        "dataset_id": test_datasets['main']['dataset_id']
    }
    
    try:
        response = requests.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        if response.status_code in [200, 201]:
            test_tasks['main'] = response.json()
            print_success(f"Created task ID: {test_tasks['main']['task_id']}")
        else:
            print_error(f"Failed to create task: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Task creation error: {str(e)}")
    
    # List tasks
    try:
        response = requests.get(f"{BASE_URL}/tasks/", headers=headers)
        if response.status_code == 200:
            tasks = response.json()
            print_success(f"Retrieved {len(tasks)} tasks")
            # Check relationships
            if tasks and 'project' in tasks[0]:
                print_success("Task-Project relationship working")
            if tasks and 'dataset' in tasks[0]:
                print_success("Task-Dataset relationship working")
        else:
            print_error(f"Failed to list tasks: {response.status_code}")
    except Exception as e:
        print_error(f"Task list error: {str(e)}")

def test_assignments(token):
    """Test task assignment"""
    print_section("6. TASK ASSIGNMENT TESTS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    if not test_tasks.get('main') or not test_users.get('Annotator'):
        print_error("Missing task or annotator for assignment")
        return
    
    # Create assignment
    assignment_data = {
        "task_id": test_tasks['main']['task_id'],
        "user_id": test_users['Annotator']['user_id'],
        "assigned_by": test_users.get('Manager', {}).get('user_id') or test_users.get('Admin', {}).get('user_id')
    }
    
    try:
        response = requests.post(f"{BASE_URL}/assignments/", json=assignment_data, headers=headers)
        if response.status_code in [200, 201]:
            test_assignments['main'] = response.json()
            print_success(f"Created assignment ID: {test_assignments['main']['assignment_id']}")
        else:
            print_error(f"Failed to create assignment: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Assignment creation error: {str(e)}")
    
    # Get user assignments with relationships
    try:
        user_id = test_users['Annotator']['user_id']
        response = requests.get(f"{BASE_URL}/assignments/user/{user_id}", headers=headers)
        if response.status_code == 200:
            assignments = response.json()
            print_success(f"Retrieved {len(assignments)} assignments for annotator")
            # Check nested relationships
            if assignments and 'task' in assignments[0]:
                print_success("Assignment-Task relationship working")
                if 'project' in assignments[0]['task']:
                    print_success("Nested Task-Project relationship working")
                if 'dataset' in assignments[0]['task']:
                    print_success("Nested Task-Dataset relationship working")
        else:
            print_error(f"Failed to get assignments: {response.status_code}")
    except Exception as e:
        print_error(f"Assignment retrieval error: {str(e)}")

def test_annotations(token):
    """Test annotation creation"""
    print_section("7. ANNOTATION TESTS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    if not test_tasks.get('main') or not test_users.get('Annotator'):
        print_error("Missing task or annotator")
        return
    
    # Create annotation
    annotation_data = {
        "task_id": test_tasks['main']['task_id'],
        "user_id": test_users['Annotator']['user_id'],
        "content": json.dumps({"text": "This is a test annotation", "sentiment": "positive"}),
        "label_ids": [test_labels['Positive']['label_id']] if test_labels.get('Positive') else []
    }
    
    try:
        response = requests.post(f"{BASE_URL}/annotations/", json=annotation_data, headers=headers)
        if response.status_code in [200, 201]:
            test_annotations['main'] = response.json()
            print_success(f"Created annotation ID: {test_annotations['main']['annotation_id']}")
        else:
            print_error(f"Failed to create annotation: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Annotation creation error: {str(e)}")
    
    # Get user annotations
    try:
        user_id = test_users['Annotator']['user_id']
        response = requests.get(f"{BASE_URL}/annotations/user/{user_id}", headers=headers)
        if response.status_code == 200:
            annotations = response.json()
            print_success(f"Retrieved {len(annotations)} annotations for user")
            # Check labels relationship
            if annotations and 'labels' in annotations[0]:
                print_success("Annotation-Labels relationship working")
        else:
            print_error(f"Failed to get annotations: {response.status_code}")
    except Exception as e:
        print_error(f"Annotation retrieval error: {str(e)}")

def test_reviews(token):
    """Test review workflow"""
    print_section("8. REVIEW WORKFLOW TESTS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    if not test_annotations.get('main') or not test_users.get('Reviewer'):
        print_error("Missing annotation or reviewer")
        return
    
    # Create review
    review_data = {
        "annotation_id": test_annotations['main']['annotation_id'],
        "reviewer_id": test_users['Reviewer']['user_id'],
        "status": "Approved",
        "feedback": "Good annotation!",
        "quality_score": 8.5
    }
    
    try:
        response = requests.post(f"{BASE_URL}/reviews/", json=review_data, headers=headers)
        if response.status_code in [200, 201]:
            test_reviews['main'] = response.json()
            print_success(f"Created review ID: {test_reviews['main']['review_id']}")
            if 'quality_score' in test_reviews['main']:
                print_success("Quality score field working")
        else:
            print_error(f"Failed to create review: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Review creation error: {str(e)}")
    
    # Get reviewer's reviews
    try:
        reviewer_id = test_users['Reviewer']['user_id']
        response = requests.get(f"{BASE_URL}/reviews/reviewer/{reviewer_id}", headers=headers)
        if response.status_code == 200:
            reviews = response.json()
            print_success(f"Retrieved {len(reviews)} reviews for reviewer")
        else:
            print_error(f"Failed to get reviews: {response.status_code}")
    except Exception as e:
        print_error(f"Review retrieval error: {str(e)}")

def test_notifications(token):
    """Test notification system"""
    print_section("9. NOTIFICATION SYSTEM TESTS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    if not test_users.get('Annotator'):
        print_error("Missing annotator")
        return
    
    # Get notifications
    try:
        user_id = test_users['Annotator']['user_id']
        response = requests.get(f"{BASE_URL}/notifications/user/{user_id}", headers=headers)
        if response.status_code == 200:
            notifications = response.json()
            print_success(f"Retrieved {len(notifications)} notifications")
            if notifications:
                print_success("Notification created on task assignment")
        else:
            print_error(f"Failed to get notifications: {response.status_code}")
    except Exception as e:
        print_error(f"Notification retrieval error: {str(e)}")

def test_audit_logs(token):
    """Test audit logging"""
    print_section("10. AUDIT LOGGING TESTS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/audit-logs/", headers=headers)
        if response.status_code == 200:
            logs = response.json()
            print_success(f"Retrieved {len(logs)} audit log entries")
            if logs and 'entity_type' in logs[0]:
                print_success("Entity tracking in audit logs working")
        else:
            print_error(f"Failed to get audit logs: {response.status_code}")
    except Exception as e:
        print_error(f"Audit log retrieval error: {str(e)}")

def test_advanced_features(token):
    """Test advanced features"""
    print_section("11. ADVANCED FEATURES TESTS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    if not test_projects.get('main'):
        print_error("Missing project for advanced features")
        return
    
    project_id = test_projects['main']['project_id']
    
    # Test Active Learning
    try:
        response = requests.get(f"{BASE_URL}/active-learning/uncertain-samples/{project_id}?limit=5", headers=headers)
        if response.status_code == 200:
            print_success("Active Learning API working")
        else:
            print_error(f"Active Learning failed: {response.status_code}")
    except Exception as e:
        print_error(f"Active Learning error: {str(e)}")
    
    # Test Quality Metrics
    if test_users.get('Annotator'):
        try:
            user_id = test_users['Annotator']['user_id']
            response = requests.get(f"{BASE_URL}/metrics/annotator/{user_id}?days=30", headers=headers)
            if response.status_code == 200:
                metrics = response.json()
                print_success(f"Quality Metrics API working - Approval rate: {metrics.get('approval_rate', 0)}%")
            else:
                print_error(f"Quality Metrics failed: {response.status_code}")
        except Exception as e:
            print_error(f"Quality Metrics error: {str(e)}")
    
    # Test Consensus
    if test_tasks.get('main'):
        try:
            task_id = test_tasks['main']['task_id']
            response = requests.get(f"{BASE_URL}/consensus/agreement/{task_id}", headers=headers)
            if response.status_code == 200:
                agreement = response.json()
                print_success(f"Consensus API working - Agreement: {agreement.get('agreement_score', 0)}%")
            else:
                print_error(f"Consensus failed: {response.status_code}")
        except Exception as e:
            print_error(f"Consensus error: {str(e)}")
    
    # Test Export
    try:
        response = requests.get(f"{BASE_URL}/export/jsonl/{project_id}", headers=headers)
        if response.status_code == 200:
            print_success("Export API working")
        else:
            print_error(f"Export failed: {response.status_code}")
    except Exception as e:
        print_error(f"Export error: {str(e)}")

def main():
    print_info(f"Starting comprehensive test suite at {datetime.now()}")
    print_info(f"Testing API at: {BASE_URL}")
    
    # Run tests
    test_authentication()
    
    # Get admin token for subsequent tests
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={"username": "admin_test", "password": "admin123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if response.status_code == 200:
            admin_token = response.json()['access_token']
            
            test_projects(admin_token)
            test_datasets(admin_token)
            test_labels(admin_token)
            test_tasks(admin_token)
            test_assignments(admin_token)
            test_annotations(admin_token)
            test_reviews(admin_token)
            test_notifications(admin_token)
            test_audit_logs(admin_token)
            test_advanced_features(admin_token)
            
            print_section("TEST SUMMARY")
            print_success("All functionality tests completed!")
            print_info("Check results above for any failures")
        else:
            print_error("Failed to get admin token for tests")
    except Exception as e:
        print_error(f"Test suite error: {str(e)}")

if __name__ == "__main__":
    main()
