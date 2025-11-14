import { createLLM } from "../config/llm.config.js";
import logger from "../utils/logger.js";

export class LLMService {
  async chat(message, options = {}) {
    try {
      const llm = createLLM(options);
      const response = await llm.invoke(message);
      return response.content;
    } catch (error) {
      logger.error('Error in chat', { error: error.message });
      throw error;
    }
  }

  async *streamChat(message, options = {}) {
    try {
      const llm = createLLM(options);
      const stream = await llm.stream(message);
      for await (const chunk of stream) {
        if (chunk.content) yield chunk.content;
      }
    } catch (error) {
      logger.error('Error in streamChat', { error: error.message });
      throw error;
    }
  }
}
