import Joi from 'joi';

const generateAnswerSchema = Joi.object({
    message: Joi.string().required(),
});

export default generateAnswerSchema;