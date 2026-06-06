import Joi from 'joi';

export const credentialPayloadSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

export const tokenPayloadSchema = Joi.object({
  refreshToken: Joi.string().required()
});