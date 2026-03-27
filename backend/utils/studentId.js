const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique student ID in the format STU-XXXXXXXX
 * Uses UUID v4 for cryptographic randomness; not easily guessable.
 */
function generateStudentId() {
  const uid = uuidv4().replace(/-/g, '').toUpperCase().substring(0, 8);
  return `STU-${uid}`;
}

module.exports = { generateStudentId };
