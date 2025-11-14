import { createLLM } from "../config/llm.config.js";
import logger from "../utils/logger.js";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

export class LLMService {
  /**
   * 将消息历史转换为 LangChain 消息格式
   * @param {Array} messages - 消息数组，格式为 [{role: 'user'|'ai', content: string}, ...]
   * @returns {Array} LangChain BaseMessage 数组
   */
  _formatMessagesForLangchain(messages = []) {
    return messages.map(msg => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else if (msg.role === 'ai' || msg.role === 'assistant') {
        return new AIMessage(msg.content);
      }
    }).filter(Boolean);
  }

  async chat(message, options = {}) {
    try {
      const llm = createLLM(options);
      const history = options.history || [];
      
      // 如果有历史消息，构建完整的对话
      if (history.length > 0) {
        const formattedMessages = this._formatMessagesForLangchain(history);
        const userMessage = new HumanMessage(message);
        
        const response = await llm.invoke([...formattedMessages, userMessage]);
        return response.content;
      } else {
        // 没有历史消息，直接处理当前消息
        const response = await llm.invoke(message);
        return response.content;
      }
    } catch (error) {
      logger.error('Error in chat', { error: error.message });
      throw error;
    }
  }

  async *streamChat(message, options = {}) {
    try {
      const llm = createLLM(options);
      const history = options.history || [];
      
      let messages;
      if (history.length > 0) {
        const formattedMessages = this._formatMessagesForLangchain(history);
        const userMessage = new HumanMessage(message);
        messages = [...formattedMessages, userMessage];
      } else {
        messages = message;
      }
      
      const stream = await llm.stream(messages);
      for await (const chunk of stream) {
        if (chunk.content) yield chunk.content;
      }
    } catch (error) {
      logger.error('Error in streamChat', { error: error.message });
      throw error;
    }
  }
}
