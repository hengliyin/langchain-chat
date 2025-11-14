import { LLMService } from "../services/llm.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";
import fs from 'fs';
import path from 'path';

const llmService = new LLMService();

// 创建日志文件路径
const logFile = path.join(process.cwd(), 'logs', 'chat-debug.log');

// 确保日志目录存在
const logsDir = path.dirname(logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 写入日志的辅助函数
function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
}

export const chat = asyncHandler(async (req, res) => {
  const { message, model, temperature, history } = req.body;
  
  // 日志: 打印接收到的参数
  writeLog('📨 Chat 请求接收:');
  writeLog(`  - 消息: "${message ? message.substring(0, 50) : '(空)'}"${message && message.length > 50 ? '...' : ''}`);
  writeLog(`  - 历史消息数: ${Array.isArray(history) ? history.length : 0}`);
  if (Array.isArray(history) && history.length > 0) {
    history.forEach((h, idx) => {
      writeLog(`    [${idx}] ${h.role}: "${h.content.substring(0, 30)}..."`);
    });
  }
  
  const result = await llmService.chat(message, { 
    model, 
    temperature: temperature ? parseFloat(temperature) : undefined,
    history: history || []
  });
  res.json(successResponse(result, "Chat completed successfully"));
});

export const streamChat = asyncHandler(async (req, res) => {
  const { message, model, history } = req.body;
  
  // 日志: 打印接收到的参数
  writeLog('📨 Stream Chat 请求接收:');
  writeLog(`  - 消息: "${message ? message.substring(0, 50) : '(空)'}"${message && message.length > 50 ? '...' : ''}`);
  writeLog(`  - 历史消息数: ${Array.isArray(history) ? history.length : 0}`);
  if (Array.isArray(history) && history.length > 0) {
    history.forEach((h, idx) => {
      writeLog(`    [${idx}] ${h.role}: "${h.content.substring(0, 30)}..."`);
    });
  }
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const stream = llmService.streamChat(message, { 
      model,
      history: history || []
    });
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
