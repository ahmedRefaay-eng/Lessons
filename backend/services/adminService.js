const userRepository = require('../repositories/userRepository');
const attendanceRepository = require('../repositories/attendanceRepository');
const gradeRepository = require('../repositories/gradeRepository');
const examRepository = require('../repositories/examRepository');
const authService = require('./authService');

class AdminService {
  async getUsers({ role } = {}) {
    return userRepository.findAll({ role });
  }

  async getReports() {
    const [users, exams, attendance, grades] = await Promise.all([
      userRepository.findAll(),
      examRepository.findAll(),
      attendanceRepository.findAll(),
      gradeRepository.findAll(),
    ]);

    const studentCount = users.filter((u) => u.role === 'student').length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const presentCount = attendance.filter((a) => a.status === 'present').length;
    const absentCount = attendance.filter((a) => a.status === 'absent').length;

    return {
      summary: {
        totalUsers: users.length,
        studentCount,
        adminCount,
        totalExams: exams.length,
        activeExams: exams.filter((e) => e.is_active).length,
        totalAttendance: attendance.length,
        presentCount,
        absentCount,
        totalGrades: grades.length,
        averageGrade:
          grades.length > 0
            ? (grades.reduce((sum, g) => sum + parseFloat(g.grade), 0) / grades.length).toFixed(2)
            : null,
      },
      recentUsers: users.slice(0, 10),
      recentExams: exams.slice(0, 10),
    };
  }

  async toggleUserStatus(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return userRepository.update(userId, { is_active: !user.is_active });
  }

  async createAdmin({ email, password, firstName, lastName }) {
    const { user } = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role: 'admin',
    });
    return user;
  }

  async changeUserRole(userId, newRole) {
    const validRoles = ['student', 'admin'];
    if (!validRoles.includes(newRole)) {
      const err = new Error('Invalid role. Must be "student" or "admin"');
      err.statusCode = 422;
      throw err;
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return userRepository.update(userId, { role: newRole });
  }
}

module.exports = new AdminService();
