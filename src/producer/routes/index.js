import { Router } from 'express';
import { upload } from '../middlewares/uploadMiddleware.js';
import webhooksRouter from '../services/webhooks/routes/index.js';
import authentications from '../services/authentications/routes/index.js';
import users from '../services/users/routes/index.js';
import generateAnswers from '../services/generate-answers/routes/index.js';
import documents from '../services/documents/routes/index.js'
import urls from '../services/urls/routes/index.js';
import authenticateToken from '../middlewares/auth.js';
import verifySuperAdmin from '../middlewares/verify-admin.js';
import verifySecretCode from '../middlewares/verifySecretCode.js';

const router = Router();

router.use('/', webhooksRouter);
router.use('/documents', authenticateToken, documents);
router.use('/authentications', authentications);
router.use('/users', authenticateToken, verifySuperAdmin, users);
router.use('/generate-answers', verifySecretCode, generateAnswers);

export default router;
