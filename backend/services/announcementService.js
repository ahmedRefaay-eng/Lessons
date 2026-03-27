const announcementRepository = require('../repositories/announcementRepository');

class AnnouncementService {
  async getAll(isAdmin = false) {
    return announcementRepository.findAll(!isAdmin);
  }

  async getById(id) {
    const announcement = await announcementRepository.findById(id);
    if (!announcement) {
      const err = new Error('Announcement not found');
      err.statusCode = 404;
      throw err;
    }
    return announcement;
  }

  async create({ title, body, createdBy }) {
    return announcementRepository.create({ title, body, createdBy });
  }

  async update(id, fields) {
    const announcement = await announcementRepository.findById(id);
    if (!announcement) {
      const err = new Error('Announcement not found');
      err.statusCode = 404;
      throw err;
    }
    return announcementRepository.update(id, fields);
  }

  async delete(id) {
    const deleted = await announcementRepository.delete(id);
    if (!deleted) {
      const err = new Error('Announcement not found');
      err.statusCode = 404;
      throw err;
    }
  }
}

module.exports = new AnnouncementService();
