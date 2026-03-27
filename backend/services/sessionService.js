const sessionRepository = require('../repositories/sessionRepository');
const courseRepository = require('../repositories/courseRepository');

class SessionService {
  async getByCourse(courseId, isAdmin = false) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
    const sessions = await sessionRepository.findByCourse(courseId, !isAdmin);
    return { course, sessions };
  }

  async getById(id) {
    const session = await sessionRepository.findById(id);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }
    return session;
  }

  async create({ courseId, title, videoUrl, notes, file, sortOrder, createdBy }) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    let fileUrl = null;
    let fileName = null;
    let mimeType = null;
    if (file) {
      fileUrl = `/uploads/${file.filename}`;
      fileName = file.originalname;
      mimeType = file.mimetype;
    }

    return sessionRepository.create({ courseId, title, videoUrl, notes, fileUrl, fileName, mimeType, sortOrder, createdBy });
  }

  async update(id, fields, file) {
    const session = await sessionRepository.findById(id);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }

    const updateFields = { ...fields };
    if (file) {
      updateFields.file_url = `/uploads/${file.filename}`;
      updateFields.file_name = file.originalname;
      updateFields.mime_type = file.mimetype;
    }

    return sessionRepository.update(id, updateFields);
  }

  async delete(id) {
    const deleted = await sessionRepository.delete(id);
    if (!deleted) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }
  }
}

module.exports = new SessionService();
