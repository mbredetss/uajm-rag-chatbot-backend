import Joi from 'joi';
import pool from '../utils/database.js';
import { publishToQueue } from '../utils/rabbitmq.js';
import ValidationError from '../exceptions/ValidationError.js';
import NotFoundError from '../exceptions/NotFoundError.js';

const INDEXING_QUEUE = 'indexing_queue';

const urlSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.uri': 'Format URL tidak valid',
    'any.required': 'URL harus diisi',
  }),
});

const documentSchema = Joi.object({
  desiredInformation: Joi.string(),
});

const addDocument = async (req) => {
  const file = req.file;
  const { desiredInformation } = req.body;

  if (!file) {
    throw new ValidationError('Dokumen harus dikirim');
  }

  const source = file.path;
  const type = 'docs';

  const result = await pool.query(
    'INSERT INTO documents (source, type, status) VALUES ($1, $2, $3) RETURNING *',
    [source, type, 'in progress'],
  );

  const document = result.rows[0];

  await publishToQueue(INDEXING_QUEUE, {
    desiredInformation, 
    source,
    type,
    documentId: document.id,
  });

  return document;
};

const addUrl = async (req) => {
  const { url } = req.body;

  if (!url) {
    throw new ValidationError('URL harus dikirim');
  }

  const { error } = urlSchema.validate({ url });
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const source = url;
  const type = 'url';

  const result = await pool.query(
    'INSERT INTO documents (source, type, status) VALUES ($1, $2, $3) RETURNING *',
    [source, type, 'in progress'],
  );

  const document = result.rows[0];

  await publishToQueue(INDEXING_QUEUE, {
    source,
    type,
    documentId: document.id,
  });

  return document;
};

const getAllDocuments = async () => {
  const result = await pool.query(
    'SELECT * FROM documents ORDER BY created_at DESC',
  );
  return result.rows;
};

const deleteDocumentBySource = async (req) => {
  const { source } = req.body;

  if (!source) {
    throw new ValidationError('Source harus dikirim');
  }

  // Hapus dari vector store (langchain_pg_embedding) berdasarkan metadata.source
  const vectorResult = await pool.query(
    `DELETE FROM langchain_pg_embedding WHERE metadata->>'source' = $1`,
    [source],
  );

  // Hapus dari table documents
  const docResult = await pool.query(
    'DELETE FROM documents WHERE source = $1',
    [source],
  );

  if (vectorResult.rowCount === 0 && docResult.rowCount === 0) {
    throw new NotFoundError(`Dokumen dengan source '${source}' tidak ditemukan`);
  }

  return {
    deletedEmbeddings: vectorResult.rowCount,
    deletedDocuments: docResult.rowCount,
  };
};

export { addDocument, addUrl, getAllDocuments, deleteDocumentBySource };
