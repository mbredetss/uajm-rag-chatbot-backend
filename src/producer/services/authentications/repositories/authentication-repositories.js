import { Pool } from 'pg';

class AuthenticationRepositories {
  constructor() {
    this.pool = new Pool();
  }

  async addRefreshToken(token) {
    await this.pool.query(
      'INSERT INTO authentications VALUES($1)', [token]
    );
  }

  async deleteRefreshToken(token) {
    await this.pool.query(
      `DELETE FROM authentications
            WHERE token = $1`, [token]
    );
  }

  async verifyRefreshToken(token) {
    const result = await this.pool.query(
      `SELECT token FROM authentications
            WHERE token = $1`, [token]
    );

    return result.rowCount;
  }

  async verifyUserCredential(username) {
    const result = await this.pool.query(
      'SELECT id, password FROM users WHERE username = $1', [username]
    );

    return result.rows[0];
  }
}

export default new AuthenticationRepositories();