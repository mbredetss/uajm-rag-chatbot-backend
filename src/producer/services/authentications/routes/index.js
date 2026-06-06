import express from 'express';
import { login, newAccessToken, deleteRefreshAccessToken } from '../controller/authentication-controller.js';
import validate from '../../../middlewares/validate.js';
import { credentialPayloadSchema, tokenPayloadSchema } from '../validator/schema.js';

const router = express.Router();

router.post('/', validate(credentialPayloadSchema), login);
router.put('/', validate(tokenPayloadSchema), newAccessToken);
router.delete('/', validate(tokenPayloadSchema), deleteRefreshAccessToken);

export default router;