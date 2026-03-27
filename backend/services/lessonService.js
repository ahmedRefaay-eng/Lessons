const lessonRepository = require('../repositories/lessonRepository');
const path = require('path');

class LessonService {
  async getAll(isAdmin = false) {
    return lessonRepository.findAll(!isAdmin);
  }

  async getById(id) {
    const lesson = await lessonRepository.findById(id);
    if (!lesson) {
      const err = new Error('Lesson not found');
      err.statusCode = 404;
      throw err;
    }
    return lesson;
  }

  async create({ title, content, file, createdBy }) {
    let fileUrl = null;
    let fileName = null;
    let mimeType = null;

    if (file) {
      fileUrl = `/uploads/${file.filename}`;
      fileName = file.originalname;
      mimeType = file.mimetype;
    }

    return lessonRepository.create({ title, content, fileUrl, fileName, mimeType, createdBy });
  }

  async update(id, fields) {
    const lesson = await lessonRepository.findById(id);
    if (!lesson) {
      const err = new Error('Lesson not found');
      err.statusCode = 404;
      throw err;
    }
    return lessonRepository.update(id, fields);
  }

  async delete(id) {
    const deleted = await lessonRepository.delete(id);
    if (!deleted) {
      const err = new Error('Lesson not found');
      err.statusCode = 404;
      throw err;
    }
  }
}

module.exports = new LessonService();
