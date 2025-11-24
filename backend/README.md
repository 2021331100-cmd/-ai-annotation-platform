# AI Data Annotation Platform - Backend

Enterprise-grade data annotation platform with role-based access control, task management, review workflows, and audit logging.

## Features

- **User Management**: Role-based system (Admin, Manager, Annotator, Reviewer)
- **Project Management**: Organize annotation work into projects
- **Dataset Management**: Upload and manage datasets in various formats
- **Task Assignment**: Assign annotation tasks to specific users
- **Annotation Workflow**: Create, update, and track annotations
- **Review System**: Quality control with review and approval workflow
- **Audit Logging**: Track all user actions for compliance
- **Notifications**: Real-time notifications for task assignments and reviews

## Database Schema

The system uses MySQL with the following core tables:
- `Users` - User accounts with roles
- `Project` - Annotation projects
- `Dataset` - Data collections
- `Label` - Annotation categories/labels
- `Annotation_Task` - Tasks linking projects to datasets
- `Task_Assignment` - User assignments to tasks
- `Annotation` - Annotation data with many-to-many label relationships
- `Review` - Quality control reviews
- `AuditLog` - Action tracking
- `Notification` - User notifications

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Database

Create a MySQL database:
```sql
CREATE DATABASE annotation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run the database schema script to create tables (see the SQL file in project docs).

### 3. Environment Configuration

Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and configuration.

### 4. Run the Application

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Users
- `POST /api/users/` - Create user
- `GET /api/users/` - List users
- `GET /api/users/{user_id}` - Get user details
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user

### Projects
- `POST /api/projects/` - Create project
- `GET /api/projects/` - List projects
- `GET /api/projects/{project_id}` - Get project
- `PUT /api/projects/{project_id}` - Update project
- `DELETE /api/projects/{project_id}` - Delete project

### Datasets
- `POST /api/datasets/` - Create dataset
- `GET /api/datasets/` - List datasets
- `GET /api/datasets/{dataset_id}` - Get dataset

### Labels
- `POST /api/labels/` - Create label
- `GET /api/labels/` - List labels

### Tasks
- `POST /api/tasks/` - Create annotation task
- `GET /api/tasks/` - List tasks
- `GET /api/tasks/{task_id}` - Get task details

### Task Assignments
- `POST /api/assignments/` - Assign task to user
- `GET /api/assignments/user/{user_id}` - Get user's assignments
- `GET /api/assignments/task/{task_id}` - Get task assignments

### Annotations
- `POST /api/annotations/` - Create annotation
- `GET /api/annotations/{annotation_id}` - Get annotation
- `GET /api/annotations/task/{task_id}` - Get task annotations
- `GET /api/annotations/user/{user_id}` - Get user's annotations
- `PUT /api/annotations/{annotation_id}` - Update annotation
- `DELETE /api/annotations/{annotation_id}` - Delete annotation

### Reviews
- `POST /api/reviews/` - Create review
- `GET /api/reviews/annotation/{annotation_id}` - Get annotation reviews
- `GET /api/reviews/reviewer/{reviewer_id}` - Get reviewer's reviews
- `PUT /api/reviews/{review_id}` - Update review

### Audit Logs
- `GET /api/audit-logs/` - Get audit logs

### Notifications
- `POST /api/notifications/` - Create notification
- `GET /api/notifications/user/{user_id}` - Get user notifications
- `PUT /api/notifications/{notification_id}/read` - Mark as read

## User Roles

- **Admin**: Full system access
- **Manager**: Manage projects, assign tasks, view reports
- **Annotator**: Create annotations for assigned tasks
- **Reviewer**: Review and approve/reject annotations

## Workflow Example

1. **Admin** creates a project and labels
2. **Manager** uploads a dataset
3. **Manager** creates annotation tasks linking project and dataset
4. **Manager** assigns tasks to annotators
5. **Annotator** receives notification and creates annotations
6. **Reviewer** reviews annotations and provides feedback
7. **System** logs all actions to audit trail

## Development

### Project Structure
```
backend/
├── main.py              # FastAPI application & routes
├── models.py            # SQLAlchemy database models
├── schemas.py           # Pydantic validation schemas
├── database.py          # Database connection
├── requirements.txt     # Python dependencies
├── .env                 # Configuration (not in git)
└── services/
    ├── user_service.py       # User management logic
    ├── project_service.py    # Project/dataset/label logic
    └── annotation_service.py # Annotation/review/audit logic
```

### Database Migration

For production, consider using Alembic for database migrations:
```bash
pip install alembic
alembic init migrations
```

## Security Notes

- Change the `SECRET_KEY` in production
- Use HTTPS in production
- Implement proper authentication middleware
- Add rate limiting
- Validate all file uploads
- Implement proper authorization checks

## License

MIT
