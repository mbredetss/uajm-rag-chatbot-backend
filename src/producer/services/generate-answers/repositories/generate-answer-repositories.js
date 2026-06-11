import pool from "../../../utils/database.js";

class GenerateAnswerRepository {
    async getChatHistory(userId) {
        const query = {
            text: 'SELECT question, answer FROM conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
            values: [userId],
        };
        const result = await pool.query(query);
        return result.rows;
    }

    async addChatHistory(userId, question, answer) {
        const query = {
            text: 'INSERT INTO conversations (user_id, question, answer) VALUES ($1, $2, $3)',
            values: [userId, question, answer],
        };
        await pool.query(query);
    }
}

export default new GenerateAnswerRepository();