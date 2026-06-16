import express from 'express';
import { addDocument, getAllDocuments } from '../controller/document-controller.js';
import { upload } from '../../../middlewares/uploadMiddleware.js';
import validate from '../../../middlewares/validate.js';
import { documentPayloadSchema } from '../validator/schema.js';

const router = express.Router();

router.post('/', upload.single('document'), validate(documentPayloadSchema), addDocument);
router.get('/', getAllDocuments);

export default router;