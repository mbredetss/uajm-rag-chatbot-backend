import Joi from 'joi';

export const urlSchema = Joi.object({
  isLongDocument: Joi.boolean().required(),
  url: Joi.string().uri().required(), 
});