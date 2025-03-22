const pool = require('./db');
const bcrypt = require('bcrypt');

const User = {
  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  async createUser(email, password, isAdmin = false) {
    const hash = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, is_admin)
       VALUES (?, ?, ?)`,
      [email, hash, isAdmin]
    );
    
    // 获取新插入的用户
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE userid = ?',
      [result.insertId]
    );
    return rows[0];
  },

  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');
    
    const isValid = await this.verifyPassword(user, currentPassword);
    if (!isValid) throw new Error('Current password is incorrect');
    
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);
    
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE userid = $2',
      [newHash, userId]
    );
  }
};

module.exports = User;