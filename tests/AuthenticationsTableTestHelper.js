import pool from "../src/producer/utils/database.js";

const AuthenticationsTableTestHelper = {
  async addToken(token) {
    const query = {
      text: 'INSERT INTO authentications VALUES($1)',
      values: [token],
    };

    await pool.query(query);
  }, 

  async findToken(token) {
    const query = {
      text: 'SELECT * FROM authentications WHERE token = $1',
      values: [token],
    };

    const result = await pool.query(query);
    return result.rows;
  }, 

  async cleanTable() {
    await pool.query('DELETE FROM authentications');
  }
}

export default AuthenticationsTableTestHelper;