import { Document } from "@langchain/core/documents";
import { BaseStore } from "@langchain/core/stores";

class PostgresDocstore extends BaseStore {
    constructor(pool) {
        super();
        this.pool = pool;
    }

    async mset(keyValuePairs) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            for (const [key, value] of keyValuePairs) {
                // value di sini adalah objek Document dari LangChain
                const query = `
          INSERT INTO parent_docstore (id, page_content, metadata) 
          VALUES ($1, $2, $3) 
          ON CONFLICT (id) DO UPDATE 
          SET page_content = EXCLUDED.page_content, metadata = EXCLUDED.metadata
        `;
                await client.query(query, [key, value.pageContent, value.metadata]);
            }
            await client.query("COMMIT");
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    // Fungsi untuk mengambil dokumen berdasarkan ID (mget = multi get)
    async mget(keys) {
        const query = `SELECT id, page_content, metadata FROM parent_docstore WHERE id = ANY($1)`;
        const result = await this.pool.query(query, [keys]);

        // LangChain meminta urutan return harus sama persis dengan urutan keys yang diminta
        const docMap = new Map(
            result.rows.map((row) => [
                row.id,
                new Document({ pageContent: row.page_content, metadata: row.metadata }),
            ])
        );

        return keys.map((key) => docMap.get(key) || undefined);
    }

    // Fungsi untuk menghapus dokumen (opsional tapi disarankan)
    async mdelete(keys) {
        const query = `DELETE FROM parent_docstore WHERE id = ANY($1)`;
        await this.pool.query(query, [keys]);
    }
}

export default PostgresDocstore;