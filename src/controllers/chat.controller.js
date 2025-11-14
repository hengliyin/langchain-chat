import { LLMService } from "../services/llm.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";

const llmService = new LLMService();

export const chat = asyncHandler(async (req, res) => {
  const { message, model, temperature } = req.body;
  const result = await llmService.chat(message, { model, temperature: temperature ? parseFloat(temperature) : undefined });
  res.json(successResponse(result, "Chat completed successfully"));
});

export const streamChat = asyncHandler(async (req, res) => {
  const { message, model } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const stream = llmService.streamChat(message, { model });
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});
