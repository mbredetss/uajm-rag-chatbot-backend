/* istanbul ignore file */
import pool from '../src/producer/utils/database.js';

const AuthenticationsTableTestHelper = {
  async cleanTable() {
    await pool.query('DELETE FROM authentications WHERE 1=1');
  },
};

export default AuthenticationsTableTestHelper;
