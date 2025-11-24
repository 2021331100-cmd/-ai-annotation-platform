-- AI Annotation Platform - MySQL Database Schema
-- Execute in DataGrip or MySQL Workbench after connecting to MySQL

-- Step 1: Create Database
CREATE DATABASE IF NOT EXISTS ai_annotation_platform 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE ai_annotation_platform;

-- The tables will be auto-created by SQLAlchemy when you run the backend
-- But you can use these queries to verify and manage data:

-- ============================================
-- USEFUL QUERIES FOR DATAGRIP
-- ============================================

-- View all tables
SHOW TABLES;

-- View table structures
DESCRIBE Users;
DESCRIBE Project;
DESCRIBE Dataset;
DESCRIBE Task;

-- ============================================
-- DATA QUERIES
-- ============================================

-- View all users with their roles
SELECT user_id, username, email, role, created_at 
FROM Users 
ORDER BY created_at DESC;

-- View all projects
SELECT * FROM Project ORDER BY created_at DESC;

-- View datasets with project info
SELECT 
    d.dataset_id,
    d.name as dataset_name,
    p.project_name,
    d.data_count,
    d.created_at
FROM Dataset d
JOIN Project p ON d.project_id = p.project_id;

-- View tasks with dataset and project
SELECT 
    t.task_id,
    t.task_name,
    t.task_type,
    t.priority,
    d.name as dataset_name,
    p.project_name
FROM Task t
JOIN Dataset d ON t.dataset_id = d.dataset_id
JOIN Project p ON d.project_id = p.project_id;

-- View annotations with user and task info
SELECT 
    a.annotation_id,
    u.username,
    u.role,
    t.task_name,
    a.annotation_data,
    a.created_at
FROM Annotation a
JOIN Users u ON a.annotator_id = u.user_id
JOIN Task t ON a.task_id = t.task_id
ORDER BY a.created_at DESC;

-- Count annotations by user
SELECT 
    u.username,
    u.role,
    COUNT(a.annotation_id) as total_annotations
FROM Users u
LEFT JOIN Annotation a ON u.user_id = a.annotator_id
GROUP BY u.user_id, u.username, u.role
ORDER BY total_annotations DESC;

-- View reviews with annotation details
SELECT 
    r.review_id,
    reviewer.username as reviewer_name,
    annotator.username as annotator_name,
    a.annotation_data,
    r.review_status,
    r.feedback,
    r.created_at
FROM Review r
JOIN Users reviewer ON r.reviewer_id = reviewer.user_id
JOIN Annotation a ON r.annotation_id = a.annotation_id
JOIN Users annotator ON a.annotator_id = annotator.user_id;

-- Project statistics
SELECT 
    p.project_name,
    p.status,
    COUNT(DISTINCT d.dataset_id) as total_datasets,
    COUNT(DISTINCT t.task_id) as total_tasks,
    COUNT(DISTINCT a.annotation_id) as total_annotations
FROM Project p
LEFT JOIN Dataset d ON p.project_id = d.project_id
LEFT JOIN Task t ON d.dataset_id = t.dataset_id
LEFT JOIN Annotation a ON t.task_id = a.task_id
GROUP BY p.project_id, p.project_name, p.status;

-- Task assignments
SELECT 
    ta.assignment_id,
    u.username,
    u.role,
    t.task_name,
    ta.assigned_at,
    ta.due_date
FROM TaskAssignment ta
JOIN Users u ON ta.user_id = u.user_id
JOIN Task t ON ta.task_id = t.task_id
ORDER BY ta.assigned_at DESC;

-- Recent activity (audit log)
SELECT 
    al.log_id,
    u.username,
    al.action,
    al.table_name,
    al.timestamp
FROM AuditLog al
JOIN Users u ON al.user_id = u.user_id
ORDER BY al.timestamp DESC
LIMIT 50;

-- Notifications
SELECT 
    n.notification_id,
    u.username,
    n.message,
    n.is_read,
    n.created_at
FROM Notification n
JOIN Users u ON n.user_id = u.user_id
ORDER BY n.created_at DESC;

-- ============================================
-- ADMINISTRATIVE QUERIES
-- ============================================

-- Database size
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'ai_annotation_platform'
GROUP BY table_schema;

-- Record counts per table
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE TABLE_SCHEMA = 'ai_annotation_platform'
ORDER BY TABLE_ROWS DESC;

-- ============================================
-- BACKUP & MAINTENANCE
-- ============================================

-- Export structure and data (use DataGrip GUI)
-- Right-click database → SQL Scripts → Dump to File

-- Or use command line:
-- mysqldump -u root -p ai_annotation_platform > backup.sql

-- Restore:
-- mysql -u root -p ai_annotation_platform < backup.sql
