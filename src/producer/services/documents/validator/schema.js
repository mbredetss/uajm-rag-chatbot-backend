import Joi from 'joi';

export const documentPayloadSchema = Joi.object({
    isChunked: Joi.boolean().required(),
})