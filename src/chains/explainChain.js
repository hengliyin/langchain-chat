import { createLLM } from "../config/llm.config.js";
import { explainPrompt } from "../prompts/explain.prompt.js";

export const createExplainChain = (options = {}) => {
  const llm = createLLM(options);
  return explainPrompt.pipe(llm).pipe(output => output.content);
};
