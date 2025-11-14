import { PromptTemplate } from "@langchain/core/prompts";

export const extractPrompt = PromptTemplate.fromTemplate(
  "从这句话中提取主题：{input}\n\n只返回提取的主题，不要其他解释。"
);
