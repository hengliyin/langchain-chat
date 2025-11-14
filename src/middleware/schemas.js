import Joi from 'joi';

export const chainProcessSchema = Joi.object({
  input: Joi.string().required().min(1).max(5000),
  model: Joi.string().optional(),
  temperature: Joi.number().optional().min(0).max(2),
  maxTokens: Joi.number().optional().min(1).max(4000),
});

export const extractTopicSchema = Joi.object({
  input: Joi.string().required().min(1).max(5000),
  model: Joi.string().optional(),
});

export const chatSchema = Joi.object({
  message: Joi.string().required().min(1).max(5000),
  model: Joi.string().optional(),
  temperature: Joi.number().optional().min(0).max(2),
});
