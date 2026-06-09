/* istanbul ignore file */
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import pool from './database.js';

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  model: 'LazarusNLP/all-indo-e5-small-v4',
  provider: "hf-inference",
});

const vectorStore = await PGVectorStore.initialize(embeddings, {
  pool,
  tableName: 'langchain_pg_embedding',
  collectionTableName: 'langchain_pg_collection',
  collectionName: 'uajm_documents',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'embedding',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
});

export default vectorStore;