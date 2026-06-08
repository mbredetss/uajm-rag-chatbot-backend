import { publishToQueue } from '../../../utils/rabbitmq.js';
import ValidationError from '../../../exceptions/ValidationError.js';
import userRepositories from '../../users/repositories/user-repositories.js';
import { response } from '../../../utils/index.js';
import documentRepositories from '../repositories/document-repositories.js';

const addDocument = async (req, res) => {
  const file = req.file;
  const { desiredInformation } = req.body;

  if (!file) {
    throw new ValidationError('Dokumen harus dikirim');
  }

  const source = file.path;
  const type = 'docs';
  const { id } = req.user;
  const fullName = await userRepositories.getFullNameById(id);

  const document = await documentRepositories.addDocuments(source, type, fullName);

  await publishToQueue('indexing_queue', {
    desiredInformation,
    source,
    type,
    documentId: document.id,
  });

  return response(res, 201, null, document);
};

const getAllDocuments = async (req, res) => {
  const result = await documentRepositories.getAllDocument();

  return response(res, 200, null, result.rows);
};

export { addDocument, getAllDocuments };
