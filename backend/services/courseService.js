const courseRepository = require('../repositories/courseRepository');

class CourseService {
  async getAll(isAdmin = false) {
    return courseRepository.findAll(!isAdmin);
  }

  async getById(id) {
    const course = await courseRepository.findById(id);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
    return course;
  }

  async create({ title, description, subject, sortOrder, createdBy }) {
    return courseRepository.create({ title, description, subject, sortOrder, createdBy });
  }

  async update(id, fields) {
    const course = await courseRepository.findById(id);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
    return courseRepository.update(id, fields);
  }

  async delete(id) {
    const deleted = await courseRepository.delete(id);
    if (!deleted) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
  }
}

module.exports = new CourseService();
