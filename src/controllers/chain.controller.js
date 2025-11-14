import { ChainService } from "../services/chain.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";

const chainService = new ChainService();

export const processChain = asyncHandler(async (req, res) => {
  const { input, model, temperature, maxTokens } = req.body;
  const result = await chainService.processFullChain(input, {
    model,
    temperature: temperature ? parseFloat(temperature) : undefined,
    maxTokens: maxTokens ? parseInt(maxTokens) : undefined,
  });
  res.json(successResponse(result, "Chain processed successfully"));
});

export const extractTopic = asyncHandler(async (req, res) => {
  const { input, model } = req.body;
  const result = await chainService.extractTopic(input, { model });
  res.json(successResponse(result, "Topic extracted successfully"));
});

export const streamChain = asyncHandler(async (req, res) => {
  const { input, model, temperature } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const stream = chainService.streamFullChain(input, { 
      model,
      temperature: temperature ? parseFloat(temperature) : undefined 
    });
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      if (res.flush) res.flush();
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
    res.end();
  }
});
