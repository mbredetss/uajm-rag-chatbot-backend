import express from 'express';
import { addUrl } from '../controller/url-controller.js';
import validate from '../../../middlewares/validate.js';
import { urlSchema } from '../validator/schema.js';

const router = express.Router();

router.post('/', validate(urlSchema), addUrl);

export default router;