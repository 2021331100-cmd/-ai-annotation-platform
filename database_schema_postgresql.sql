-- ==========================================
-- AI DATA ANNOTATION PLATFORM
-- Database Schema for PostgreSQL (Supabase)
-- ==========================================

-- ==========================================
-- DROP EXISTING TABLES (optional for re-run)
-- ==========================================
DROP TABLE IF EXISTS Annotation_Label CASCADE;
DROP TABLE IF EXISTS Review CASCADE;
DROP TABLE IF EXISTS Annotation CASCADE;
DROP TABLE IF EXISTS Task_Assignment CASCADE;
DROP TABLE IF EXISTS Annotation_Task CASCADE;
DROP TABLE IF EXISTS Notification CASCADE;
DROP TABLE IF EXISTS AuditLog CASCADE;
DROP TABLE IF EXISTS Label CASCADE;
DROP TABLE IF EXISTS Dataset CASCADE;
DROP TABLE IF EXISTS Project CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Manager', 'Annotator', 'Reviewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON Users(username);
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_role ON Users(role);

-- ==========================================
-- PROJECT TABLE
-- ==========================================
CREATE TABLE Project (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Completed', 'On Hold')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_status ON Project(status);
CREATE INDEX idx_project_created_at ON Project(created_at);

-- ==========================================
-- DATASET TABLE
-- ==========================================
CREATE TABLE Dataset (
    dataset_id SERIAL PRIMARY KEY,
    dataset_name VARCHAR(150) NOT NULL,
    description TEXT,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    format VARCHAR(50) NOT NULL
);

CREATE INDEX idx_dataset_name ON Dataset(dataset_name);
CREATE INDEX idx_dataset_format ON Dataset(format);

-- ==========================================
-- LABEL TABLE
-- ==========================================
CREATE TABLE Label (
    label_id SERIAL PRIMARY KEY,
    label_name VARCHAR(100) NOT NULL,
    description TEXT,
    color_code VARCHAR(20)
);

CREATE INDEX idx_label_name ON Label(label_name);

-- ==========================================
-- ANNOTATION TASK TABLE
-- ==========================================
CREATE TABLE Annotation_Task (
    task_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    dataset_id INTEGER NOT NULL,
    due_date DATE,
    FOREIGN KEY (project_id) REFERENCES Project(project_id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES Dataset(dataset_id) ON DELETE CASCADE
);

CREATE INDEX idx_task_project_id ON Annotation_Task(project_id);
CREATE INDEX idx_task_dataset_id ON Annotation_Task(dataset_id);
CREATE INDEX idx_task_due_date ON Annotation_Task(due_date);

-- ==========================================
-- TASK ASSIGNMENT TABLE
-- ==========================================
CREATE TABLE Task_Assignment (
    assignment_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assign_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    FOREIGN KEY (task_id) REFERENCES Annotation_Task(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_assignment_task_id ON Task_Assignment(task_id);
CREATE INDEX idx_assignment_user_id ON Task_Assignment(user_id);
CREATE INDEX idx_assignment_due_date ON Task_Assignment(due_date);

-- ==========================================
-- ANNOTATION TABLE
-- ==========================================
CREATE TABLE Annotation (
    annotation_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content TEXT,
    FOREIGN KEY (task_id) REFERENCES Annotation_Task(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_annotation_task_id ON Annotation(task_id);
CREATE INDEX idx_annotation_user_id ON Annotation(user_id);
CREATE INDEX idx_annotation_create_date ON Annotation(create_date);

-- ==========================================
-- ANNOTATION_LABEL TABLE (MANY-TO-MANY)
-- ==========================================
CREATE TABLE Annotation_Label (
    annotation_id INTEGER NOT NULL,
    label_id INTEGER NOT NULL,
    PRIMARY KEY (annotation_id, label_id),
    FOREIGN KEY (annotation_id) REFERENCES Annotation(annotation_id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES Label(label_id) ON DELETE CASCADE
);

CREATE INDEX idx_annotation_label_annotation_id ON Annotation_Label(annotation_id);
CREATE INDEX idx_annotation_label_label_id ON Annotation_Label(label_id);

-- ==========================================
-- REVIEW TABLE
-- ==========================================
CREATE TABLE Review (
    review_id SERIAL PRIMARY KEY,
    annotation_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    feedback TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    FOREIGN KEY (annotation_id) REFERENCES Annotation(annotation_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_review_annotation_id ON Review(annotation_id);
CREATE INDEX idx_review_reviewer_id ON Review(reviewer_id);
CREATE INDEX idx_review_status ON Review(status);

-- ==========================================
-- AUDIT LOG TABLE
-- ==========================================
CREATE TABLE AuditLog (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_auditlog_user_id ON AuditLog(user_id);
CREATE INDEX idx_auditlog_action ON AuditLog(action);
CREATE INDEX idx_auditlog_time_stamp ON AuditLog(time_stamp);

-- ==========================================
-- NOTIFICATION TABLE
-- ==========================================
CREATE TABLE Notification (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_notification_user_id ON Notification(user_id);
CREATE INDEX idx_notification_is_read ON Notification(is_read);
CREATE INDEX idx_notification_created_date ON Notification(created_date);

-- ==========================================
-- SAMPLE DATA (Optional - password is "password")
-- ==========================================

-- Insert sample users
INSERT INTO Users (username, email, password, role) VALUES
('admin', 'admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEm31i', 'Admin'),
('manager1', 'manager@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEm31i', 'Manager'),
('annotator1', 'annotator1@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEm31i', 'Annotator'),
('reviewer1', 'reviewer@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEm31i', 'Reviewer');

-- Insert sample project
INSERT INTO Project (project_name, description, status) VALUES
('Image Classification', 'Classify product images into categories', 'Active');

-- Insert sample labels
INSERT INTO Label (label_name, description, color_code) VALUES
('Electronics', 'Electronic devices and gadgets', '#FF6B6B'),
('Clothing', 'Apparel and accessories', '#4ECDC4'),
('Food', 'Food items and beverages', '#45B7D1'),
('Furniture', 'Home and office furniture', '#FFA07A');

-- Insert sample dataset
INSERT INTO Dataset (dataset_name, description, format) VALUES
('Product Images Q1 2024', 'First quarter product catalog images', 'image/jpeg');
