import { ChatOpenAI } from "@langchain/openai";
import 'dotenv/config';

export const DEFAULT_MODEL_CONFIG = {
  model: process.env.DEFAULT_MODEL || "gpt-4o-mini",
  temperature: parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
  maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS) || 1000,
};

export const createLLM = (options = {}) => {
  const config = { ...DEFAULT_MODEL_CONFIG, ...options };
  return new ChatOpenAI({
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    },
  });
};
