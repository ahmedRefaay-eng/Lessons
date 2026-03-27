# 🎓 Student Management System

A **production-ready** full-stack web platform for managing students, exams, attendance, lessons, and admin controls.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Authentication | JWT + bcrypt |
| Email | Nodemailer (SMTP) |
| Frontend | React |
| Security | Helmet, rate limiting, input validation |
| Containerization | Docker + Docker Compose |

---

## 📁 Project Structure

```
.
├── backend/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── repositories/      # Database access
│   ├── routes/            # Express routes
│   ├── middleware/        # Auth, validation, upload
│   ├── utils/             # Logger, mailer, student ID generator
│   ├── config/            # Database configuration
│   ├── __tests__/         # Jest unit tests
│   ├── server.js          # Express app entry point
│   └── .env.example       # Environment template
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/      # Login, Register
│   │   │   ├── student/   # Dashboard, Exams, Grades, Attendance, Lessons
│   │   │   └── admin/     # Admin dashboard and management pages
│   │   ├── components/    # Navbar, UI components, ProtectedRoute
│   │   ├── context/       # AuthContext
│   │   └── services/      # Axios API client
│   └── .env.example
├── database/
│   └── schema.sql         # Full PostgreSQL schema
├── docker-compose.yml
└── README.md
```

---

## 🔐 Core Security Features

- ✅ JWT authentication with secure token validation
- ✅ bcrypt password hashing (12 rounds)
- ✅ **Exam access requires student_id verification** (even when logged in)
- ✅ Role-based access control (Admin / Student)
- ✅ Rate limiting (global + per-route for auth)
- ✅ Input validation with express-validator
- ✅ Helmet.js for HTTP security headers
- ✅ CORS protection
- ✅ SQL injection protection (parameterized queries)

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd Lessons

# Create .env for Docker (optional overrides)
cp backend/.env.example backend/.env
# Edit backend/.env with your SMTP settings

# Start all services
docker-compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Option 2: Manual Setup

#### Prerequisites
- Node.js 18+
- PostgreSQL 14+

#### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE student_management;"

# Run schema
psql -U postgres -d student_management -f database/schema.sql
```

#### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials, JWT secret, and SMTP settings

npm install
npm start
# Backend runs on http://localhost:5000
```

#### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000/api

npm install
npm start
# Frontend runs on http://localhost:3000
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_management
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_32_char_min_secret_key
JWT_EXPIRES_IN=24h

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM_NAME=Student Management System

# App
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

---

## 📡 API Reference

### Authentication

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Password1",
  "firstName": "John",
  "lastName": "Doe"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Password1"
}
```

### Exams

```http
GET /api/exams
Authorization: Bearer <token>

POST /api/exams          (admin)
PUT /api/exams/:id       (admin)
DELETE /api/exams/:id    (admin)
POST /api/exams/:id/assign  (admin)

# Start exam — REQUIRES student_id
POST /api/exams/:id/start
Authorization: Bearer <token>

{
  "student_id": "STU-A1B2C3D4"
}
```

### Attendance

```http
GET  /api/attendance/:user_id    (self or admin)
GET  /api/attendance             (admin)
POST /api/attendance             (admin)
```

### Grades

```http
GET  /api/grades/:user_id        (self or admin)
GET  /api/grades                 (admin)
POST /api/grades                 (admin)
```

### Lessons

```http
GET    /api/lessons
GET    /api/lessons/:id
POST   /api/lessons       (admin, multipart/form-data)
PUT    /api/lessons/:id   (admin)
DELETE /api/lessons/:id   (admin)
```

### Admin

```http
GET   /api/admin/users
GET   /api/admin/reports
PATCH /api/admin/users/:id/toggle
```

---

## 🧪 Testing

```bash
cd backend
npm test
```

Tests cover:
- Student ID generation (uniqueness, format)
- AuthService (register, login, validation)
- ExamService (start exam flow with all access checks)

---

## 📧 Email Automation

1. **Registration**: Student receives their unique Student ID via email
2. **Absence Alert**: When a student exceeds 3 absences, all admin emails are notified

---

## 🔑 Exam Access Flow

1. Student logs in → receives JWT
2. Student clicks "Start Exam"
3. Modal appears requiring **Student ID** input
4. System validates:
   - Student ID matches logged-in user
   - Exam is active
   - Student is assigned to the exam
5. On success: `entered_with_id = true`, attendance marked as present
6. On failure: access denied with clear error message

---

## 🏭 Production Deployment

### Environment
- Set `NODE_ENV=production`
- Use a strong, random `JWT_SECRET` (32+ characters)
- Configure real SMTP credentials
- Use a managed PostgreSQL instance

### Docker Production

```bash
# Set environment variables
export JWT_SECRET=your_very_long_secret_key_here
export SMTP_USER=alerts@yourcompany.com
export SMTP_PASS=your_app_password

docker-compose up -d --build
```

### Create First Admin User

```sql
-- After running the schema, insert an admin user
-- Password: AdminPass1 (change this!)
INSERT INTO users (email, password, student_id, role, first_name, last_name)
VALUES (
  'admin@example.com',
  '$2a$12$YOUR_BCRYPT_HASH_HERE',
  'STU-ADMIN001',
  'admin',
  'System',
  'Admin'
);
```

Or use the register endpoint and then update the role:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `users` | Students and admins with unique student_id |
| `exams` | Exam definitions |
| `exam_access` | Per-student exam permissions + entered_with_id tracking |
| `attendance` | Present/absent records per exam |
| `grades` | Numerical grades per student per exam |
| `lessons` | Content and file attachments |
| `audit_logs` | System activity log |

---

## 📜 License

MIT
