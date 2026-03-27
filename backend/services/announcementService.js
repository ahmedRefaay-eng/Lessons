const announcementRepository = require('../repositories/announcementRepository');
const { broadcastAnnouncement } = require('./automation/notificationAutomation');
const logger = require('../utils/logger');

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
    const announcement = await announcementRepository.create({ title, body, createdBy });

    // Non-blocking: broadcast email to all students
    broadcastAnnouncement(announcement.id).catch((err) =>
      logger.error('[AnnouncementService] Broadcast failed', {
        announcementId: announcement.id,
        error: err.message,
      })
    );

    return announcement;
  }

  async update(id, fields) {
    const announcement = await announcementRepository.findById(id);
    if (!announcement) {
      const err = new Error('Announcement not found');
      err.statusCode = 404;
      throw err;
    }
    const updated = await announcementRepository.update(id, fields);

    // If being published for the first time, broadcast
    if (fields.is_published === true && !announcement.is_published) {
      broadcastAnnouncement(id).catch((err) =>
        logger.error('[AnnouncementService] Broadcast on publish failed', {
          announcementId: id,
          error: err.message,
        })
      );
    }

    return updated;
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
