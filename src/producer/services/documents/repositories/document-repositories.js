import pool from "../../../utils/database.js";

class DocumentRepositories {
    async addDocuments(source, type, username) {
        const result = await pool.query(
            `INSERT INTO documents (source, type, status, username) VALUES ($1, $2, $3, $4) RETURNING *`,
            [source, type, 'in progress', username],
        );

        return result.rows[0];
    }

    async getAllDocument() {
        return await pool.query(
            'SELECT * FROM documents ORDER BY created_at DESC',
        );
    }
}

export default new DocumentRepositories();