import pool from '../../../utils/database.js';

class AuthenticationRepositories {
  async addRefreshToken(token) {
    await pool.query(
      'INSERT INTO authentications VALUES($1)', [token]
    );
  }

  async deleteRefreshToken(token) {
    await pool.query(
      `DELETE FROM authentications
            WHERE token = $1`, [token]
    );
  }

  async verifyRefreshToken(token) {
    const result = await pool.query(
      `SELECT token FROM authentications
            WHERE token = $1`, [token]
    );

    return result.rowCount;
  }

  async verifyUserCredential(username) {
    const result = await pool.query(
      'SELECT id, password FROM users WHERE username = $1', [username]
    );

    return result.rows[0];
  }
}

export default new AuthenticationRepositories();