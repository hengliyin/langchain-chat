import { createLLM } from "../config/llm.config.js";
import { createExtractChain, createExplainChain } from "../chains/index.js";
import logger from "../utils/logger.js";

export class ChainService {
  async processFullChain(input, options = {}) {
    try {
      logger.info('Processing full chain', { input });
      const extractChain = createExtractChain(options);
      const topic = await extractChain.invoke({ input });
      logger.info('Topic extracted', { topic });
      const explainChain = createExplainChain(options);
      const explanation = await explainChain.invoke({ topic });
      logger.info('Full chain completed');
      return explanation;
    } catch (error) {
      logger.error('Error in processFullChain', { error: error.message });
      throw error;
    }
  }

  async extractTopic(input, options = {}) {
    try {
      const chain = createExtractChain(options);
      return await chain.invoke({ input });
    } catch (error) {
      logger.error('Error in extractTopic', { error: error.message });
      throw error;
    }
  }

  async *streamFullChain(input, options = {}) {
    try {
      logger.info('Streaming full chain', { input });
      yield { type: 'status', content: '正在提取主题...\n\n' };
      const extractChain = createExtractChain(options);
      const topic = await extractChain.invoke({ input });
      logger.info('Topic extracted for streaming', { topic });
      yield { type: 'topic', content: `主题：${topic}\n\n` };
      yield { type: 'status', content: '正在生成解释...\n\n' };
      const llm = createLLM(options);
      const stream = await llm.stream(`用更简单、通俗易懂的语言解释这个主题：${topic}\n\n请用1-2段话解释。`);
      for await (const chunk of stream) {
        if (chunk.content) {
          yield { type: 'content', content: chunk.content };
        }
      }
      logger.info('Stream completed');
    } catch (error) {
      logger.error('Error in streamFullChain', { error: error.message });
      throw error;
    }
  }
}
