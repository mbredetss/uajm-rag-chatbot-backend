import ValidationError from '../../../exceptions/ClientError.js';
import { response } from '../../../utils/index.js';
import { publishToQueue } from '../../../utils/rabbitmq.js';
import documentRepositories from '../../documents/repositories/document-repositories.js';
import userRepositories from '../../users/repositories/user-repositories.js';

const addUrl = async (req, res) => {
    const { url, desiredInformation } = req.body;

    if (!url) {
        throw new ValidationError('URL harus dikirim');
    }

    const source = url;
    const type = 'url';
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

export { addUrl };