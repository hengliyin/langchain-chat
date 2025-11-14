import { createLLM } from "../config/llm.config.js";
import { extractPrompt } from "../prompts/extract.prompt.js";

export const createExtractChain = (options = {}) => {
  const llm = createLLM(options);
  return extractPrompt.pipe(llm).pipe(output => output.content);
};
