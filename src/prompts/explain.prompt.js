import { PromptTemplate } from "@langchain/core/prompts";

export const explainPrompt = PromptTemplate.fromTemplate(
  "用更简单、通俗易懂的语言解释这个主题：{topic}\n\n请用1-2段话解释。"
);
