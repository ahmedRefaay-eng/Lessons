const gradeRepository = require('../repositories/gradeRepository');
const userRepository = require('../repositories/userRepository');

class GradeService {
  async getByUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return gradeRepository.findByUser(userId);
  }

  async getByExam(examId) {
    return gradeRepository.findByExam(examId);
  }

  async getAll() {
    return gradeRepository.findAll();
  }

  async upsert({ userId, examId, grade, feedback, gradedBy }) {
    return gradeRepository.upsert({ userId, examId, grade, feedback, gradedBy });
  }

  async getExamStats(examId) {
    const [grades, stats] = await Promise.all([
      gradeRepository.findByExam(examId),
      gradeRepository.getAverageByExam(examId),
    ]);
    return { grades, average: parseFloat(stats.average || 0).toFixed(2), total: stats.total };
  }
}

module.exports = new GradeService();
