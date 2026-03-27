-- =============================================
-- Student Management System - Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Users Table
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    student_id  VARCHAR(20) UNIQUE NOT NULL,
    role        VARCHAR(10) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    first_name  VARCHAR(100),
    last_name   VARCHAR(100),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_role       ON users(role);

-- =============================================
-- Exams Table
-- =============================================
CREATE TABLE IF NOT EXISTS exams (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    date        TIMESTAMP WITH TIME ZONE NOT NULL,
    duration    INTEGER NOT NULL CHECK (duration > 0),  -- minutes
    is_active   BOOLEAN NOT NULL DEFAULT FALSE,
    created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_is_active  ON exams(is_active);
CREATE INDEX IF NOT EXISTS idx_exams_date       ON exams(date);

-- =============================================
-- ExamAccess Table
-- =============================================
CREATE TABLE IF NOT EXISTS exam_access (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id          INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    allowed          BOOLEAN NOT NULL DEFAULT FALSE,
    entered_with_id  BOOLEAN NOT NULL DEFAULT FALSE,
    started_at       TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_access_user_id  ON exam_access(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_access_exam_id  ON exam_access(exam_id);

-- =============================================
-- Attendance Table
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id    INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    status     VARCHAR(10) NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent')),
    marked_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_exam_id ON attendance(exam_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status  ON attendance(status);

-- =============================================
-- Grades Table
-- =============================================
CREATE TABLE IF NOT EXISTS grades (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id    INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    grade      NUMERIC(5, 2) NOT NULL CHECK (grade >= 0 AND grade <= 100),
    feedback   TEXT,
    graded_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    graded_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_grades_user_id ON grades(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_exam_id ON grades(exam_id);

-- =============================================
-- Lessons Table
-- =============================================
CREATE TABLE IF NOT EXISTS lessons (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    content      TEXT,
    file_url     VARCHAR(500),
    file_name    VARCHAR(255),
    mime_type    VARCHAR(100),
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_is_published ON lessons(is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_created_by   ON lessons(created_by);

-- =============================================
-- Audit Log Table (optional but production-ready)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity      VARCHAR(100),
    entity_id   INTEGER,
    details     JSONB,
    ip_address  INET,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =============================================
-- updated_at trigger function
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_exam_access_updated_at
    BEFORE UPDATE ON exam_access
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
