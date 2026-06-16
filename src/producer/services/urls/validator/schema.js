import Joi from 'joi';

export const urlSchema = Joi.object({
  isChunked: Joi.boolean().required(),
  url: Joi.string().uri().required(), 
});