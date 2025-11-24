# 🚀 Quick Start Guide - AI Annotation Platform with MySQL

## Your Setup:
- ✅ DataGrip connected to MySQL (MariaDB 10.4.32)
- ✅ Connection: localhost:3306
- ✅ User: root
- ✅ MySQL drivers installed (pymysql)

---

## Step-by-Step Setup

### **STEP 1: Create Database in DataGrip**

1. Open **DataGrip**
2. Select your data source: **@localhost [2]**
3. Open **Query Console** (right-click data source → New → Query Console)
4. Run this SQL:

```sql
CREATE DATABASE IF NOT EXISTS ai_annotation_platform 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

5. Refresh your database to see the new database

---

### **STEP 2: Verify Database Configuration**

The `.env` file has been updated with MySQL connection:

```env
DATABASE_URL=mysql+pymysql://root:@localhost:3306/ai_annotation_platform
```

**✅ Ready to use!** (No password needed for default XAMPP setup)

---

### **STEP 3: Start Backend Server**

Open PowerShell and run:

```powershell
cd "c:\Users\user\Documents\New folder\ai-annotation-platform\backend"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**What happens:**
- ✅ Backend starts on http://localhost:8000
- ✅ SQLAlchemy automatically creates all tables in MySQL
- ✅ API documentation available at http://localhost:8000/docs

---

### **STEP 4: Verify Tables in DataGrip**

1. In DataGrip, expand: **@localhost [2]** → **ai_annotation_platform**
2. Right-click database → **Synchronize** (or press Ctrl+F5)
3. You should see these tables:
   - ✅ Users
   - ✅ Project
   - ✅ Dataset
   - ✅ Label
   - ✅ Task
   - ✅ TaskAssignment
   - ✅ Annotation
   - ✅ Review
   - ✅ AuditLog
   - ✅ Notification

---

### **STEP 5: Start Frontend**

Open another PowerShell window:

```powershell
cd "c:\Users\user\Documents\New folder\ai-annotation-platform\frontend"
npm run dev
```

**Access frontend:** http://localhost:5173 or http://localhost:3000

---

## 🔍 Test Your Setup

### 1. Check Backend API
Visit: http://localhost:8000/docs

You should see interactive API documentation (Swagger UI)

### 2. Test Database Connection
In DataGrip, run:

```sql
USE ai_annotation_platform;
SHOW TABLES;
SELECT * FROM Users;
```

### 3. Create Test User
Use the API docs at `/docs` or run in DataGrip:

```sql
-- View users (will be empty initially)
SELECT * FROM Users;
```

Then register a user via the frontend at http://localhost:5173

---

## 📊 Useful DataGrip Queries

See `datagrip_queries.sql` for comprehensive queries, or use these quick ones:

```sql
-- View all data
SELECT * FROM Users;
SELECT * FROM Project;
SELECT * FROM Annotation;

-- Count records
SELECT 
    'Users' as TableName, COUNT(*) as Count FROM Users
UNION ALL
SELECT 'Projects', COUNT(*) FROM Project
UNION ALL
SELECT 'Annotations', COUNT(*) FROM Annotation;

-- Recent activity
SELECT u.username, a.annotation_id, a.created_at 
FROM Annotation a
JOIN Users u ON a.annotator_id = u.user_id
ORDER BY a.created_at DESC
LIMIT 10;
```

---

## ⚙️ Complete Startup Commands

### Quick Start (Copy-paste these):

**Terminal 1 - Backend:**
```powershell
cd "c:\Users\user\Documents\New folder\ai-annotation-platform\backend"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```powershell
cd "c:\Users\user\Documents\New folder\ai-annotation-platform\frontend"
npm run dev
```

---

## 🎯 Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| MySQL (DataGrip) | localhost:3306 |
| Database | ai_annotation_platform |

---

## 🐛 Troubleshooting

### "Can't connect to MySQL server"
```powershell
# Check if MySQL is running in XAMPP Control Panel
# Start MySQL service
```

### "Access denied for user 'root'"
```env
# Edit backend/.env and add password:
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/ai_annotation_platform
```

### "Unknown database 'ai_annotation_platform'"
```sql
-- Run in DataGrip:
CREATE DATABASE ai_annotation_platform;
```

### Tables not appearing
```powershell
# Restart backend server - it auto-creates tables
# Then refresh DataGrip (Ctrl+F5)
```

---

## ✅ Checklist

Before starting:
- [ ] XAMPP MySQL is running
- [ ] Database created in DataGrip
- [ ] Backend .env has correct DATABASE_URL
- [ ] pymysql installed (`pip install pymysql cryptography`)

To start project:
- [ ] Run backend server (Terminal 1)
- [ ] Run frontend server (Terminal 2)
- [ ] Verify tables in DataGrip
- [ ] Open frontend in browser
- [ ] Test user registration

---

## 🎉 You're Ready!

Your AI Annotation Platform is now connected to MySQL and ready to use.

**Next Steps:**
1. Run the commands above
2. Register a user via frontend
3. Explore dashboards (Admin, Manager, Annotator, Reviewer)
4. Upload datasets
5. Create annotations
6. Use DataGrip to query and analyze data

**Happy Annotating! 🚀**
