# 对话历史功能 - 快速参考

## 📝 功能概述

✅ **已实现**: AI 现在能够记住之前的聊天内容，支持连贯的多轮对话

## 🔧 修改概览

| 文件 | 修改内容 |
|------|---------|
| `src/services/llm.service.js` | 添加 `_formatMessagesForLangchain()` 方法，支持对话历史 |
| `src/controllers/chat.controller.js` | 在 `chat()` 和 `streamChat()` 中添加 `history` 参数支持 |
| `public/chat.js` | 在 `streamResponse()` 和 `normalResponse()` 中发送对话历史 |

## 🚀 快速开始

1. **启动服务器**
   ```bash
   npm run dev
   ```

2. **使用 Web 界面**
   - 打开 `http://localhost:3000`
   - 开始对话，AI 会记住之前的内容

3. **测试功能**
   ```bash
   npm run test:conversation
   ```

## 💡 工作原理

```
用户消息 → 前端收集历史 → 发送到后端 → LLM 使用历史 → 返回上下文相关的回复
```

### 数据流

```javascript
// 前端发送的请求格式
{
  "message": "我叫什么名字？",
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "history": [
    { "role": "user", "content": "我叫张三" },
    { "role": "ai", "content": "你好张三！" }
  ]
}

// 后端处理流程
1. 接收消息和历史
2. 将历史转换为 LangChain 格式
3. 组合历史 + 当前消息
4. 调用 LLM 获取响应
5. 返回上下文相关的回复
```

## 📊 测试场景

运行 `test-conversation.js` 会执行以下对话流程：

```
第1条: "我叫张三"
    → AI: 欢迎张三！

第2条: "我喜欢编程和旅游"
    → AI: 很好的爱好！

第3条: "我叫什么名字？我的爱好是什么？"
    → AI: 你叫张三，爱好是编程和旅游 ✓
```

✓ = 成功（AI 记得了之前的信息）

## 🔍 验证功能是否工作

### 检查 1: 查看网络请求
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 发送消息
4. 找到 `/api/chat` 请求，点击查看
5. 在 Request Body 中应该能看到 `history` 数组

### 检查 2: 查看浏览器存储
1. 打开浏览器开发者工具 (F12)
2. 切换到 Application/Storage 标签
3. 点击 Local Storage
4. 查看 `chatHistory` 项应该包含完整的对话记录

### 检查 3: 运行测试脚本
```bash
npm run test:conversation
```
如果第 3 条消息的回复中 AI 提到了"张三"和"编程"+"旅游"，说明功能正常工作。

## ⚙️ API 变更

### 之前
```javascript
POST /api/chat
{
  "message": "你好",
  "model": "gpt-4o-mini"
}
```

### 现在
```javascript
POST /api/chat
{
  "message": "你好",
  "model": "gpt-4o-mini",
  "history": [/* 完整的对话历史 */]  // ← 新增
}
```

**向后兼容**: 不发送 `history` 参数时，系统仍然能够工作（作为首轮对话）

## 🎯 核心改进

| 方面 | 改进前 | 改进后 |
|------|-------|-------|
| 对话连贯性 | ❌ 每条消息独立 | ✅ 记得前文内容 |
| 上下文理解 | ❌ 无 | ✅ 完整的对话历史 |
| 用户体验 | ❌ 需要重复信息 | ✅ 自然的多轮对话 |
| 本地存储 | ✅ 已有 | ✅ 保持不变 |

## 📦 依赖

已有的依赖完全满足需求：
- `@langchain/core` - 提供 `HumanMessage` 和 `AIMessage`

无需安装额外依赖！

## 🐛 常见问题

**Q: 为什么 AI 还是不记得我的信息？**
A: 
- 检查是否开始了新对话（刷新页面或点击"新建对话"）
- 查看浏览器控制台是否有错误
- 确认后端服务正常运行

**Q: 对话会一直增长吗？**
A:
- 是的，当前实现会保留完整历史
- 可以手动清空单个对话或开始新对话
- 刷新页面也会从最后一个对话开始

**Q: 会不会很耗 Token？**
A:
- 是的，完整历史会增加 Token 消耗
- 对于短对话（< 100 条消息）影响不大
- 长对话可能需要优化（参考 CONVERSATION_HISTORY.md）

## 📚 相关文档

- `CONVERSATION_HISTORY.md` - 详细的功能文档和改进方向
- `test-conversation.js` - 测试脚本
- `src/services/llm.service.js` - LLM 服务实现
- `src/controllers/chat.controller.js` - API 控制器
