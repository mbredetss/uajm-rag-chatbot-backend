import { Router } from 'express';
import { upload } from '../middlewares/uploadMiddleware.js';
import { addDocument, addUrl, getAllDocuments, deleteDocumentBySource } from '../services/DocumentService.js';
import { successResponse } from '../utils/response.js';
import webhooksRouter from '../services/webhooks/routes/index.js';
import authentications from '../services/authentications/routes/index.js';
import users from '../services/users/routes/index.js';
import generateAnswers from '../services/generate-answers/routes/index.js';
import authenticateToken from '../middlewares/auth.js';
import verifySuperAdmin from '../middlewares/verify-admin.js';
import verifySecretCode from '../middlewares/verifySecretCode.js';

const router = Router();

router.use('/', webhooksRouter);

router.post('/documents', authenticateToken, upload.single('document'), async (req, res, next) => {
  try {
    const document = await addDocument(req);
    return successResponse(res, 201, 'Dokumen berhasil diunggah', document);
  } catch (error) {
    next(error);
  }
});

router.post('/urls', authenticateToken, async (req, res, next) => {
  try {
    const document = await addUrl(req);
    return successResponse(res, 201, 'URL berhasil diunggah', document);
  } catch (error) {
    next(error);
  }
});

router.get('/documents', authenticateToken, async (req, res, next) => {
  try {
    const documents = await getAllDocuments(req);
    return successResponse(res, 200, 'Berhasil mengambil data dokumen', documents);
  } catch (error) {
    next(error);
  }
});

router.delete('/documents', authenticateToken, async (req, res, next) => {
  try {
    const result = await deleteDocumentBySource(req);
    return successResponse(res, 200, 'Dokumen berhasil dihapus', result);
  } catch (error) {
    next(error);
  }
});

router.use('/authentications', authentications);
router.use('/users', authenticateToken, verifySuperAdmin, users);
router.use('/generate-answers', verifySecretCode, generateAnswers);

export default router;
