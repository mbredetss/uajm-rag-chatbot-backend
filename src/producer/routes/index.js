import { Router } from 'express';
import { upload } from '../middlewares/uploadMiddleware.js';
import { addDocument, addUrl, getAllDocuments } from '../services/DocumentService.js';
import { verifyWebhook, handleIncomingMessage } from '../services/WebhookService.js';
import { successResponse } from '../utils/response.js';

const router = Router();

router.post('/documents', upload.single('document'), async (req, res, next) => {
  try {
    const document = await addDocument(req);
    return successResponse(res, 201, 'Dokumen berhasil diunggah', document);
  } catch (error) {
    next(error);
  }
});

router.post('/urls', async (req, res, next) => {
  try {
    const document = await addUrl(req);
    return successResponse(res, 201, 'URL berhasil diunggah', document);
  } catch (error) {
    next(error);
  }
});

router.get('/documents', async (req, res, next) => {
  try {
    const documents = await getAllDocuments();
    return successResponse(res, 200, 'Berhasil mengambil data dokumen', documents);
  } catch (error) {
    next(error);
  }
});

router.get('/webhook', verifyWebhook);

router.post('/webhook', async (req, res, next) => {
  try {
    await handleIncomingMessage(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
