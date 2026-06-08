import Joi from 'joi';

export const urlSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.uri': 'Format URL tidak valid',
    'any.required': 'URL harus dikirim',
  }),
});