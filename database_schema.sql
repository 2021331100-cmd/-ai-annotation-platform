-- ==========================================
-- AI DATA ANNOTATION PLATFORM
-- Database Schema for MySQL
-- ==========================================

-- ==========================================
-- DROP EXISTING TABLES (optional for re-run)
-- ==========================================
DROP TABLE IF EXISTS Annotation_Label, Review, Annotation, Task_Assignment, Annotation_Task,
Notification, AuditLog, Label, Dataset, Project, Users;

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Manager', 'Annotator', 'Reviewer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- PROJECT TABLE
-- ==========================================
CREATE TABLE Project (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('Pending', 'Active', 'Completed', 'On Hold') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- DATASET TABLE
-- ==========================================
CREATE TABLE Dataset (
    dataset_id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_name VARCHAR(150) NOT NULL,
    description TEXT,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    format VARCHAR(50) NOT NULL,
    INDEX idx_dataset_name (dataset_name),
    INDEX idx_format (format)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- LABEL TABLE
-- ==========================================
CREATE TABLE Label (
    label_id INT AUTO_INCREMENT PRIMARY KEY,
    label_name VARCHAR(100) NOT NULL,
    description TEXT,
    color_code VARCHAR(20),
    INDEX idx_label_name (label_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- ANNOTATION TASK TABLE
-- ==========================================
CREATE TABLE Annotation_Task (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    dataset_id INT NOT NULL,
    due_date DATE,
    FOREIGN KEY (project_id) REFERENCES Project(project_id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES Dataset(dataset_id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TASK ASSIGNMENT TABLE
-- ==========================================
CREATE TABLE Task_Assignment (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    assign_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    FOREIGN KEY (task_id) REFERENCES Annotation_Task(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id),
    INDEX idx_user_id (user_id),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- ANNOTATION TABLE
-- ==========================================
CREATE TABLE Annotation (
    annotation_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content TEXT,
    FOREIGN KEY (task_id) REFERENCES Annotation_Task(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id),
    INDEX idx_user_id (user_id),
    INDEX idx_create_date (create_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- ANNOTATION_LABEL TABLE (MANY-TO-MANY)
-- ==========================================
CREATE TABLE Annotation_Label (
    annotation_id INT NOT NULL,
    label_id INT NOT NULL,
    PRIMARY KEY (annotation_id, label_id),
    FOREIGN KEY (annotation_id) REFERENCES Annotation(annotation_id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES Label(label_id) ON DELETE CASCADE,
    INDEX idx_annotation_id (annotation_id),
    INDEX idx_label_id (label_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- REVIEW TABLE
-- ==========================================
CREATE TABLE Review (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    annotation_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    feedback TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    FOREIGN KEY (annotation_id) REFERENCES Annotation(annotation_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_annotation_id (annotation_id),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- AUDIT LOG TABLE
-- ==========================================
CREATE TABLE AuditLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_time_stamp (time_stamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- NOTIFICATION TABLE
-- ==========================================
CREATE TABLE Notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_date (created_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SAMPLE DATA (Optional)
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
