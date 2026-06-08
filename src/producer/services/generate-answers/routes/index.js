import express from 'express';
import validate from '../../../middlewares/validate.js';
import generateAnswerSchema from '../validator/schema.js';
import generateAnswer from '../controller/generate-answer-controller.js';

const router = express.Router();

router.post('/', validate(generateAnswerSchema), generateAnswer);

export default router;