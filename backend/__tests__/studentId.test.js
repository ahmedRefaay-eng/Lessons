const { generateStudentId } = require('../utils/studentId');

describe('generateStudentId', () => {
  it('should return a string starting with STU-', () => {
    const id = generateStudentId();
    expect(id).toMatch(/^STU-[A-F0-9]{8}$/);
  });

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateStudentId()));
    expect(ids.size).toBe(100);
  });

  it('should always be 12 characters long', () => {
    for (let i = 0; i < 10; i++) {
      expect(generateStudentId()).toHaveLength(12);
    }
  });
});
