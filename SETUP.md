# AI Data Annotation Platform - Setup Guide

## Quick Start (Recommended)

### Option 1: One-Click Startup (Windows)
Simply double-click `start.bat` - it will:
1. Install Python dependencies
2. Install Node.js dependencies  
3. Start backend server (http://localhost:8000)
4. Start frontend UI (http://localhost:3000)

### Option 2: Manual Setup

#### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL 8.0+ (or use SQLite for development)

#### Step 1: Database Setup

**For MySQL (Production):**
```bash
# Create database
mysql -u root -p
CREATE DATABASE annotation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# Run schema
mysql -u root -p annotation_db < database_schema.sql

# Update backend/.env with your MySQL credentials
```

**For SQLite (Development):**
```bash
# No setup needed - SQLite will auto-create the database file
# Update backend/.env to use SQLite URL
```

#### Step 2: Backend Setup
```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your settings

# Start backend
python main.py
```

Backend will run at: http://localhost:8000

#### Step 3: Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at: http://localhost:3000

## First Steps After Installation

1. **Open Frontend**: Navigate to http://localhost:3000
2. **Create Users**: Go to Users page and create accounts for:
   - Admin user
   - Manager user
   - Annotator user
   - Reviewer user
3. **Create Project**: Go to Projects page and create your first annotation project
4. **Create Dataset**: Upload or reference your data
5. **Create Labels**: Define annotation categories
6. **Create Tasks**: Link projects and datasets
7. **Assign Tasks**: Assign tasks to annotators
8. **Start Annotating**: Annotators create annotations
9. **Review**: Reviewers approve/reject annotations

## API Documentation

Once the backend is running, access interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Testing the Setup

1. Visit http://localhost:3000
2. Click "Users" and create a test user
3. Click "Projects" and create a test project
4. Verify everything works!

## Troubleshooting

### Backend won't start
- Check Python is installed: `python --version`
- Check all dependencies installed: `pip install -r requirements.txt`
- Check MySQL is running (if using MySQL)
- Check .env configuration

### Frontend won't start
- Check Node.js is installed: `node --version`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check port 3000 is not in use

### Database connection error
- Verify MySQL credentials in backend/.env
- Ensure database exists
- Check MySQL is running

### Port already in use
- Backend: Change port in backend/main.py (line: `uvicorn.run(app, port=8000)`)
- Frontend: Change port in frontend/vite.config.js

## Default Configuration

- **Backend Port**: 8000
- **Frontend Port**: 3000
- **Database**: MySQL (annotation_db) or SQLite
- **CORS**: Enabled for localhost:3000

## Production Deployment

For production deployment:
1. Use PostgreSQL or MySQL (not SQLite)
2. Set strong SECRET_KEY in .env
3. Disable debug mode
4. Use production ASGI server (gunicorn)
5. Set up reverse proxy (Nginx)
6. Enable HTTPS
7. Build frontend: `npm run build`
8. Serve frontend build with Nginx/Apache

## Support

- Backend API Docs: http://localhost:8000/docs
- Check README.md in backend/ folder
- Check logs in terminal windows

## Sample Data

The database_schema.sql includes sample data:
- 4 sample users (admin, manager, annotator, reviewer)
- 1 sample project
- 4 sample labels
- 1 sample dataset

**Default Password for sample users**: `password` (hashed)

## Next Steps

1. Customize the frontend UI
2. Add authentication/JWT
3. Implement file upload
4. Add real-time notifications
5. Build annotation tools (bounding boxes, polygons)
6. Add export functionality
7. Create analytics dashboard
