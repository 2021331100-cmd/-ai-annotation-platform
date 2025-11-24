# AI Data Annotation Platform

Enterprise-grade platform for managing data annotation workflows with role-based access control, task management, review systems, and audit logging.

## Overview

This platform enables teams to efficiently annotate data for machine learning projects with:
- Multi-user collaboration with role-based permissions
- Project and dataset management
- Task assignment and tracking
- Quality control through review workflows
- Complete audit trails
- Real-time notifications

## System Architecture

```
ai-annotation-platform/
├── backend/          # FastAPI REST API server
│   ├── main.py      # API endpoints
│   ├── models.py    # Database models
│   ├── schemas.py   # Data validation
│   └── services/    # Business logic
└── frontend/         # React web application (to be implemented)
```

## User Roles

1. **Admin** - Full system access, user management
2. **Manager** - Project management, task assignment, reporting
3. **Annotator** - Create and edit annotations for assigned tasks
4. **Reviewer** - Quality control, approve/reject annotations

## Database Schema

### Core Tables
- **Users** - User accounts with roles and authentication
- **Project** - Annotation projects with status tracking
- **Dataset** - Data collections in various formats
- **Label** - Annotation categories/tags
- **Annotation_Task** - Tasks linking projects to datasets
- **Task_Assignment** - User-to-task assignments
- **Annotation** - Annotation data with content
- **Annotation_Label** - Many-to-many annotation-label relationships
- **Review** - Quality control reviews with feedback
- **AuditLog** - Complete action history
- **Notification** - User notifications

## Quick Start

### Prerequisites
- Python 3.8+
- MySQL 8.0+ or SQLite (for development)
- Node.js 16+ (for frontend)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create MySQL database:
```sql
CREATE DATABASE annotation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Run the database schema script (see `database_schema.sql`)

5. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

6. Start the server:
```bash
python main.py
```

API will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

## Typical Workflow

1. **Setup Phase**
   - Admin creates user accounts with appropriate roles
   - Manager creates project and defines labels
   - Manager uploads dataset

2. **Task Assignment**
   - Manager creates annotation tasks
   - Manager assigns tasks to annotators
   - System sends notifications to assigned users

3. **Annotation Phase**
   - Annotators log in and see their assigned tasks
   - Annotators create annotations with labels
   - Progress is tracked automatically

4. **Review Phase**
   - Reviewers examine annotations
   - Reviewers approve or request changes
   - System notifies annotators of feedback

5. **Audit & Export**
   - All actions logged in audit trail
   - Export annotations in various formats
   - Generate reports and metrics

## API Features

### Authentication & Authorization
- User registration and login
- Role-based access control
- Password hashing with bcrypt

### Project Management
- Create/update/delete projects
- Track project status (Pending, Active, Completed, On Hold)
- Link projects to datasets and tasks

### Task Management
- Create annotation tasks
- Assign tasks to users with due dates
- Track assignment progress
- Automatic notifications

### Annotation Workflow
- Create annotations with multiple labels
- Store annotation content (JSON format for flexibility)
- Update and delete annotations
- Link annotations to specific tasks

### Review System
- Submit reviews with feedback
- Approve or reject annotations
- Track review status
- Notify annotators of review decisions

### Audit & Compliance
- Log all user actions
- Track timestamps and details
- Filter logs by user or action
- Complete compliance trail

### Notifications
- Real-time notifications for assignments
- Review status updates
- Mark as read functionality
- User-specific notification inbox

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **Pydantic** - Data validation
- **MySQL** - Production database
- **Passlib** - Password hashing
- **Uvicorn** - ASGI server

### Frontend (To be implemented)
- React
- TypeScript
- Tailwind CSS
- React Query
- Zustand (state management)

## Development

### Running in Development Mode
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing the API
Use the interactive docs at http://localhost:8000/docs or tools like:
- curl
- Postman
- HTTPie

### Example API Calls

Create a user:
```bash
curl -X POST "http://localhost:8000/api/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepass123",
    "role": "Annotator"
  }'
```

Create a project:
```bash
curl -X POST "http://localhost:8000/api/projects/" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Image Classification Project",
    "description": "Classify product images",
    "status": "Active"
  }'
```

## Production Deployment

### Security Checklist
- [ ] Change SECRET_KEY in .env
- [ ] Use strong database passwords
- [ ] Enable HTTPS/TLS
- [ ] Implement rate limiting
- [ ] Add authentication middleware
- [ ] Set up firewall rules
- [ ] Regular backups
- [ ] Monitor audit logs

### Recommended Setup
- Use PostgreSQL or MySQL in production
- Deploy behind Nginx reverse proxy
- Use Docker for containerization
- Implement CI/CD pipeline
- Set up monitoring (Prometheus, Grafana)
- Configure log aggregation

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check the API documentation at /docs
- Review the backend README.md

## Roadmap

- [ ] Frontend React application
- [ ] Authentication with JWT tokens
- [ ] File upload and management
- [ ] Advanced annotation tools (bounding boxes, polygons)
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Export to multiple formats (COCO, YOLO, Pascal VOC)
- [ ] API rate limiting
- [ ] WebSocket notifications
- [ ] Mobile app support
