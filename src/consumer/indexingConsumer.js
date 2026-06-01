import path from 'path';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import pool from '../producer/utils/database.js';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 100,
});

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  model: 'LazarusNLP/all-indo-e5-small-v4',
  provider: "hf-inference",
});

const getVectorStore = async () => {
  return await PGVectorStore.initialize(embeddings, {
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
};

const vectorStore = await getVectorStore();

const loadDocument = async (source, type) => {
  if (type === 'url') {
    const loader = new CheerioWebBaseLoader(source, {
      selector: 'p, ol, h1, h2, h3, h4, h5, h6',
    });
    return await loader.load();
  }

  const ext = path.extname(source).toLowerCase();

  if (ext === '.pdf') {
    const loader = new PDFLoader(source, { splitPages: false });
    return await loader.load();
  }

  if (ext === '.csv') {
    const loader = new TextLoader(source);
    return await loader.load();
  }

  if (ext === '.docx') {
    const loader = new DocxLoader(source);
    return await loader.load();
  }

  throw new Error(`Format dokumen tidak didukung: ${ext}`);
};

const updateDocumentStatus = async (documentId, status) => {
  await pool.query(
    'UPDATE documents SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, documentId],
  );
};

const docsCleaning = (docs) => {
  return docs.map(doc => ({
    ...doc, 
    pageContent: doc.pageContent.replace(/[\n\r\t]/g, ' '),
  }));
};

const processIndexing = async ({ source, type, documentId }) => {
  try {
    const docs = await loadDocument(source, type);
    const cleanDocs = docsCleaning(docs);
    const splitDocs = await splitter.splitDocuments(cleanDocs);
    await vectorStore.addDocuments(splitDocs);
    await updateDocumentStatus(documentId, 'completed');
    console.log(`Indexing selesai untuk dokumen ${documentId}`);
  } catch (error) {
    console.error(`Indexing gagal untuk dokumen ${documentId}:`, error);
    await updateDocumentStatus(documentId, 'failed');
  }
};

export { processIndexing, getVectorStore };
