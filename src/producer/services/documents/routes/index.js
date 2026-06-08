import express from 'express';
import { addDocument, getAllDocuments } from '../controller/document-controller.js';
import { upload } from '../../../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/', upload.single('document'), addDocument);
router.get('/', getAllDocuments);

export default router;