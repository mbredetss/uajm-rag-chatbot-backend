import Joi from 'joi';
import pool from '../utils/database.js';
import { publishToQueue } from '../utils/rabbitmq.js';
import ValidationError from '../exceptions/ValidationError.js';
import AuthenticationError from '../exceptions/AuthenticationError.js';

const INDEXING_QUEUE = 'indexing_queue';

const urlSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.uri': 'Format URL tidak valid',
    'any.required': 'URL harus diisi',
  }),
  secretCode: Joi.string().required(),
});

const documentSchema = Joi.object({
  secretCode: Joi.string().required(),
});

const verifySecretCode = (secretCode) => {
  if (secretCode !== process.env.SECRET_CODE) {
    throw new AuthenticationError('Kode rahasia tidak valid');
  }
};

const addDocument = async (req) => {
  const file = req.file;
  const { url, secretCode } = req.body;

  if (!file && !url) {
    throw new ValidationError('Dokumen atau URL harus dikirim');
  }

  if (file && url) {
    throw new ValidationError('Kirim dokumen atau URL, tidak keduanya');
  }

  if (url) {
    const { error } = urlSchema.validate({ url, secretCode });
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
  } else {
    const { error } = documentSchema.validate({ secretCode });
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
  }

  verifySecretCode(secretCode);

  const source = file ? file.path : url;
  const type = file ? 'docs' : 'url';

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

export { addDocument, getAllDocuments };
