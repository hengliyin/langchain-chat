# 在线 Chat 功能说明

## 概述

`chat.html` 是一个功能完整的在线 AI Chat 应用，提供了现代化的聊天界面和丰富的功能特性。

## 功能特性

### 1. **多轮对话**
   - 支持流式和非流式两种响应模式
   - 完整的对话历史记录
   - 用户友好的消息展示

### 2. **对话管理**
   - 创建新对话
   - 对话列表侧边栏
   - 一键切换不同对话
   - 清空当前对话
   - 导出对话为文本文件

### 3. **模型配置**
   - 支持多种模型选择（GPT-3.5 Turbo、GPT-4、Claude 3 Sonnet）
   - 可调节的温度参数（0.0 - 1.0）
   - 实时预览参数变化

### 4. **用户界面**
   - **侧边栏**：对话列表、模型选择、温度调节
   - **聊天区域**：消息显示、输入框、发送按钮
   - **消息展示**：用户消息（紫色）、AI 消息（白色）、时间戳
   - **响应模式切换**：流式输出 / 普通处理

### 5. **快捷操作**
   - `Ctrl+Enter` 快速发送消息
   - `Shift+Enter` 消息框内换行
   - 一键导出对话
   - 一键清空对话

### 6. **数据持久化**
   - 自动保存对话历史到 localStorage
   - 页面刷新后恢复对话历史
   - 5 秒间隔自动保存

## 使用方法

### 访问应用
```
http://localhost:3000/chat.html
```

### 发送消息
1. 在输入框输入你的问题或消息
2. 点击发送按钮或按 `Ctrl+Enter` 发送
3. 等待 AI 的响应

### 创建新对话
- 点击侧边栏的"➕ 新建对话"按钮
- 系统会自动创建一个新的对话会话

### 切换对话
- 在侧边栏的对话列表中点击任意对话
- 当前对话会高亮显示

### 导出对话
- 点击聊天区域右上角的"📥 导出"按钮
- 对话会以 `.txt` 文件格式下载

### 清空对话
- 点击聊天区域右上角的"🗑️ 清空"按钮
- 确认后当前对话内容会被清空

### 调整模型和温度
1. 在侧边栏找到"模型选择"和"温度"设置
2. 修改相应的值
3. 下一条消息会使用新的配置

## 技术栈

### 前端
- **HTML5** - 语义化标记
- **CSS3** - 现代样式和响应式设计
- **Vanilla JavaScript** - 纯 JS 实现，无框架依赖

### 功能实现
- **Fetch API** - HTTP 请求
- **ReadableStream** - 流式响应处理
- **LocalStorage** - 数据持久化
- **Event Listeners** - 交互处理

### 后端接口
- `POST /api/chat` - 普通模式下的聊天
- `POST /api/chat/stream` - 流式模式下的聊天

## 前端文件结构

```
public/
├── chat.html          # Chat 应用主页面
├── chat.js            # Chat 应用逻辑
├── chat-styles.css    # Chat 应用样式
├── index.html         # 应用导航页面
├── test-stream.html   # 流式处理测试页面
├── app.js             # 流式测试逻辑
└── styles.css         # 流式测试样式
```

## API 接口说明

### 普通模式
```
POST /api/chat
Content-Type: application/json

{
  "message": "你好",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7
}

Response:
{
  "success": true,
  "data": "你好，有什么我可以帮助你的吗？",
  "message": "Chat completed successfully"
}
```

### 流式模式
```
POST /api/chat/stream
Content-Type: application/json

{
  "message": "你好",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7
}

Response (Server-Sent Events):
data: {"content": "你"}
data: {"content": "好"}
data: [DONE]
```

## 消息格式

### 用户消息
```javascript
{
  role: "user",
  content: "用户输入的内容",
  timestamp: "14:30:45"
}
```

### AI 消息
```javascript
{
  role: "ai",
  content: "AI 的回复内容",
  timestamp: "14:30:47"
}
```

## 样式定制

### 主题色
在 `chat-styles.css` 中修改渐变色：
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 消息气泡样式
- 用户消息：渐变紫色背景
- AI 消息：白色背景带边框

### 响应式断点
- **大屏** (>768px)：侧边栏 + 聊天区
- **平板** (480-768px)：减小元素尺寸
- **手机** (<480px)：侧边栏顶部显示

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ 移动浏览器

## 常见问题

### Q: 对话历史会丢失吗？
A: 对话历史存储在浏览器的 LocalStorage 中，只要不清除浏览器缓存就会保留。

### Q: 可以同时打开多个对话吗？
A: 可以的，点击"新建对话"创建多个独立的对话，可以随时切换。

### Q: 流式模式和普通模式有什么区别？
A: 流式模式会实时显示 AI 逐字生成的内容，普通模式需要等待完整响应。

### Q: 如何修改默认模型？
A: 在 `chat.js` 中修改 `modelSelect` 的初始值。

### Q: 可以自定义系统提示词吗？
A: 目前还不支持，这是一个待实现的功能。

## 未来改进方向

- [ ] 自定义系统提示词
- [ ] 支持上传文件进行分析
- [ ] 对话搜索功能
- [ ] 云端同步对话历史
- [ ] 支持语音输入
- [ ] 支持 Markdown 渲染
- [ ] 消息编辑和删除
- [ ] 暗黑模式
- [ ] 多语言支持

## 许可证

MIT License
