/* istanbul ignore file */
import pool from '../src/producer/utils/database.js';

const AuthenticationsTableTestHelper = {
  async cleanTable() {
    await pool.query(`DELETE FROM authentications WHERE token != 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItWi1OQjRldWkwS2djcE1NMCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MDczNzUwMH0.XgolNroP05b-YRZ3oh89qRFJFUNQgvMUxXdxp3X'`);
  },
};

export default AuthenticationsTableTestHelper;
