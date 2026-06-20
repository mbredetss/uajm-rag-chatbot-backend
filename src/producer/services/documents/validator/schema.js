import Joi from 'joi';

export const documentPayloadSchema = Joi.object({
    isLongDocument: Joi.boolean().required(),
})