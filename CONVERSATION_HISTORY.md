# Chat 对话历史功能

## 功能说明

本项目现已增加了**对话历史记忆**功能。现在 AI 可以记住之前的聊天内容，进行连贯的多轮对话。

## 实现原理

### 1. **前端（前端客户端）**
- `public/chat.js` 中的 `sendMessage()` 函数现在会发送完整的对话历史
- 对话历史以 `history` 参数传递给后端 API
- 格式: `{ role: 'user'|'ai', content: string }`

### 2. **后端（API 服务）**
- `src/controllers/chat.controller.js` 现在接收 `history` 参数
- 将历史消息传递给 LLM 服务

### 3. **LLM 服务**
- `src/services/llm.service.js` 中新增 `_formatMessagesForLangchain()` 方法
- 将消息历史转换为 LangChain 的消息格式（`HumanMessage` 和 `AIMessage`）
- 在调用 LLM 时，将完整的消息历史（包括当前消息）一起发送

## 修改的文件

### 1. `src/services/llm.service.js`
```javascript
// 新增支持对话历史的方法
_formatMessagesForLangchain(messages = [])  // 转换消息格式
chat(message, options = {})                  // 支持 history 参数
streamChat(message, options = {})            // 支持 history 参数
```

### 2. `src/controllers/chat.controller.js`
```javascript
// 现在接收和传递 history 参数
export const chat = asyncHandler(async (req, res) => {
  const { message, model, temperature, history } = req.body;
  // ...
});

export const streamChat = asyncHandler(async (req, res) => {
  const { message, model, history } = req.body;
  // ...
});
```

### 3. `public/chat.js`
```javascript
// streamResponse 和 normalResponse 函数现在包含历史消息
const historyMessages = chat.messages.slice(0, -1);
body: JSON.stringify({
  message,
  model: modelSelect.value,
  temperature: parseFloat(temperatureSlider.value),
  history: historyMessages  // 新增
})
```

## 本地存储特性

前端已内置本地存储功能：
- 对话历史存储在浏览器的 `localStorage` 中
- 刷新页面后对话历史自动恢复
- 每 5 秒自动保存一次对话
- 关闭浏览器时自动保存

## 使用方式

### 基本对话流程

1. **第一条消息**
   ```javascript
   POST /api/chat
   {
     "message": "你好，我叫张三",
     "model": "gpt-4o-mini",
     "temperature": 0.7,
     "history": []  // 第一条消息没有历史
   }
   ```

2. **第二条消息**
   ```javascript
   POST /api/chat
   {
     "message": "我叫什么名字？",
     "model": "gpt-4o-mini",
     "temperature": 0.7,
     "history": [
       { "role": "user", "content": "你好，我叫张三" },
       { "role": "ai", "content": "你好张三，很高兴认识你！" }
     ]
   }
   ```
   此时 AI 会记得你之前的自我介绍，能正确回答你的名字。

## 测试对话历史功能

运行测试脚本：
```bash
# 首先启动服务器
npm run dev

# 在另一个终端运行测试
npm run test:conversation
```

测试脚本会进行多轮对话，验证 AI 是否能记住之前的信息。

## API 参数说明

### POST /api/chat
```json
{
  "message": "当前消息内容",
  "model": "gpt-4o-mini",           // 可选，默认从环境变量读取
  "temperature": 0.7,               // 可选，0-2 之间
  "history": [                       // 可选，对话历史
    {
      "role": "user|ai",
      "content": "消息内容"
    }
  ]
}
```

### POST /api/chat/stream
流式接口支持相同的参数，实现流式传输对话历史。

## 性能考虑

- **Token 消耗**: 发送历史消息会增加 Token 消耗。对于长对话，可能需要实现消息摘要或滑动窗口
- **延迟**: 较长的对话历史可能增加 API 延迟
- **成本**: 根据模型计费方式，完整历史会增加费用

## 未来改进方向

1. **自动摘要**: 对长对话进行自动摘要，减少 Token 消耗
2. **上下文窗口管理**: 实现智能的消息窗口管理
3. **服务端存储**: 在数据库中存储对话历史（当前使用 localStorage）
4. **用户认证**: 添加用户账户，支持跨设备同步对话历史

## 故障排除

### AI 不记得之前的对话
- 检查浏览器控制台是否有错误
- 确认网络请求中 `history` 参数已正确发送
- 检查后端日志，确认历史消息已被接收

### 本地存储已满
- 清除浏览器缓存或导出对话后清空
- 使用导出功能备份重要对话

### Token 过多
- 使用"新建对话"开始新的对话线程
- 长对话中可能需要清空历史重新开始
