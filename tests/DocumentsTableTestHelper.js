import pool from '../src/producer/utils/database.js';

const DocumentsTableTestHelper = {
  async findDocumentBySource(source) {
    const query = {
      text: 'SELECT * FROM documents WHERE source = $1',
      values: [source],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM documents');
  },

  async cleanVectorsBySource(source) {
    await pool.query(
      `DELETE FROM langchain_pg_embedding WHERE metadata->>'source' = $1`,
      [source],
    );
  },
};

export default DocumentsTableTestHelper;
