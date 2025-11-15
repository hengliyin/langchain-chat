const API_BASE = 'http://localhost:3000/api';

// 数据存储
let chatHistory = {};
let currentChatId = null;
let chatCounter = 0;

// DOM 元素
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messagesContainer');
const chatList = document.getElementById('chatList');
const newChatBtn = document.getElementById('newChatBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const exportChatBtn = document.getElementById('exportChatBtn');
const modelSelect = document.getElementById('modelSelect');
const temperatureSlider = document.getElementById('temperatureSlider');
const tempValue = document.getElementById('tempValue');
const streamToggle = document.getElementById('streamToggle');
const chatTitle = document.getElementById('chatTitle');
const chatSubtitle = document.getElementById('chatSubtitle');
const tokenCount = document.getElementById('tokenCount');

// 初始化
function init() {
  createNewChat();
  attachEventListeners();
  loadChatHistory();
}

// 事件监听
function attachEventListeners() {
  sendBtn.addEventListener('click', sendMessage);
  newChatBtn.addEventListener('click', createNewChat);
  clearChatBtn.addEventListener('click', clearCurrentChat);
  exportChatBtn.addEventListener('click', exportChat);
  
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  temperatureSlider.addEventListener('input', (e) => {
    tempValue.textContent = e.target.value;
  });

  // 自动调整 textarea 高度
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    
    // 计算当前消息的 token 数（粗略估算：中文 1 个字符 ≈ 1 token，英文 1 个单词 ≈ 1.3 token）
    const message = messageInput.value;
    let tokenEstimate = 0;
    
    // 计数中文字符（汉字）
    const chineseMatch = message.match(/[\u4e00-\u9fff]/g);
    if (chineseMatch) {
      tokenEstimate += chineseMatch.length;
    }
    
    // 计数英文单词
    const englishMatch = message.match(/\b\w+\b/g);
    if (englishMatch) {
      tokenEstimate += Math.ceil(englishMatch.length * 1.3);
    }
    
    // 更新 token 显示
    tokenCount.textContent = `预计 token: ${tokenEstimate}`;
  });
}

// 创建新对话
function createNewChat() {
  currentChatId = `chat_${++chatCounter}_${Date.now()}`;
  chatHistory[currentChatId] = {
    id: currentChatId,
    title: `对话 ${chatCounter}`,
    messages: [],
    createdAt: new Date().toLocaleString('zh-CN')
  };
  
  updateChatList();
  renderMessages();
  updateChatHeader();
  messageInput.focus();
}

// 更新对话列表
function updateChatList() {
  chatList.innerHTML = '';
  
  Object.values(chatHistory).forEach(chat => {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
    
    // 创建标题和删除按钮的容器
    const itemContent = document.createElement('div');
    itemContent.className = 'chat-item-content';
    itemContent.style.display = 'flex';
    itemContent.style.justifyContent = 'space-between';
    itemContent.style.alignItems = 'center';
    itemContent.style.width = '100%';
    
    const titleSpan = document.createElement('span');
    titleSpan.textContent = chat.title;
    titleSpan.style.flex = '1';
    titleSpan.style.cursor = 'pointer';
    
    // 点击标题切换对话
    titleSpan.addEventListener('click', () => {
      currentChatId = chat.id;
      updateChatList();
      renderMessages();
      updateChatHeader();
    });
    
    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-chat-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.style.background = 'none';
    deleteBtn.style.border = 'none';
    deleteBtn.style.color = '#ff6b6b';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.fontSize = '16px';
    deleteBtn.style.padding = '0 4px';
    deleteBtn.style.marginLeft = '8px';
    deleteBtn.title = '删除对话';
    
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`确定要删除"${chat.title}"吗？`)) {
        delete chatHistory[chat.id];
        // 如果删除的是当前对话，切换到其他对话
        if (chat.id === currentChatId) {
          const remainingChats = Object.values(chatHistory);
          if (remainingChats.length > 0) {
            currentChatId = remainingChats[0].id;
          } else {
            // 所有对话都被删除，重置计数器并创建新对话
            chatCounter = 0;
            createNewChat();
          }
        }
        updateChatList();
        renderMessages();
        updateChatHeader();
      }
    });
    
    itemContent.appendChild(titleSpan);
    itemContent.appendChild(deleteBtn);
    chatItem.appendChild(itemContent);
    chatList.appendChild(chatItem);
  });
}

// 更新聊天标题
function updateChatHeader() {
  const chat = chatHistory[currentChatId];
  if (chat) {
    chatTitle.textContent = chat.title;
    chatSubtitle.textContent = `创建于 ${chat.createdAt}`;
  }
}

// 发送消息
async function sendMessage() {
  const message = messageInput.value.trim().replace(/\n\s*\n/g, '\n');
  
  if (!message) {
    return;
  }

  // 添加用户消息到历史
  addMessageToHistory('user', message);
  renderMessages();
  messageInput.value = '';
  messageInput.style.height = 'auto';
  
  // 更新对话标题
  const chat = chatHistory[currentChatId];
  if (chat.messages.length === 1) {
    chat.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
    updateChatList();
  }

  // 发送到服务器
  sendBtn.disabled = true;

  try {
    const useStream = streamToggle.checked;
    const endpoint = useStream ? '/chat/stream' : '/chat';
    
    if (useStream) {
      await streamResponse(message, endpoint);
    } else {
      await normalResponse(message, endpoint);
    }
  } catch (error) {
    addMessageToHistory('ai', `❌ 错误: ${error.message}`);
    renderMessages();
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

// 流式响应
async function streamResponse(message, endpoint) {
  const chat = chatHistory[currentChatId];
  // 获取当前对话的历史消息（用户已发送，AI 还未回复）
  const historyMessages = chat.messages;
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      model: modelSelect.value,
      temperature: parseFloat(temperatureSlider.value),
      history: historyMessages
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  let aiMessage = '';
  addMessageToHistory('ai', '');
  renderMessages();  // 立即渲染空的 AI 消息框，这样流式更新时有 DOM 元素可以更新
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastUpdateTime = Date.now();
  const updateInterval = 50; // 每 50ms 最多更新一次 UI（减少重排）

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          if (json.content) {
            aiMessage += json.content;
            
            // 使用节流来限制 UI 更新频率，防止过度重排
            const now = Date.now();
            if (now - lastUpdateTime >= updateInterval) {
              updateLastMessage(aiMessage);
              lastUpdateTime = now;
            }
          } else if (json.error) {
            console.error('Stream error:', json.error);
          }
        } catch (e) {
          console.error('Failed to parse JSON:', e);
        }
      }
    }
  }
  
  // 确保最后一次更新被显示
  updateLastMessage(aiMessage);
}

// 普通响应
async function normalResponse(message, endpoint) {
  const chat = chatHistory[currentChatId];
  // 获取当前对话的历史消息（用户已发送，AI 还未回复）
  const historyMessages = chat.messages;
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      model: modelSelect.value,
      temperature: parseFloat(temperatureSlider.value),
      history: historyMessages
    })
  });

  const result = await response.json();

  if (result.success) {
    addMessageToHistory('ai', result.data);
    renderMessages();
  } else {
    throw new Error(result.message || '处理失败');
  }
}

// 添加消息到历史
function addMessageToHistory(role, content) {
  const chat = chatHistory[currentChatId];
  chat.messages.push({
    role,
    content,
    timestamp: new Date().toLocaleTimeString('zh-CN')
  });
}

// 更新最后一条消息（优化版：只更新 DOM，不重新渲染所有消息）
let updateLastMessagePending = false;
function updateLastMessage(content) {
  const chat = chatHistory[currentChatId];
  if (chat.messages.length > 0) {
    chat.messages[chat.messages.length - 1].content = content;
    
    // 使用 requestAnimationFrame 来批量更新，减少重排
    if (!updateLastMessagePending) {
      updateLastMessagePending = true;
      requestAnimationFrame(() => {
        // 直接更新 DOM 中的最后一条消息，而不是重新渲染所有消息
        const messageElements = messagesContainer.querySelectorAll('.message');
        if (messageElements.length > 0) {
          const lastMessageEl = messageElements[messageElements.length - 1];
          const contentEl = lastMessageEl.querySelector('.message-content');
          if (contentEl) {
            contentEl.textContent = content;
          }
        }
        
        // 自动滚动到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        updateLastMessagePending = false;
      });
    }
  }
}

// 渲染消息
function renderMessages() {
  const chat = chatHistory[currentChatId];
  
  if (!chat || chat.messages.length === 0) {
    messagesContainer.innerHTML = `
      <div class="welcome-message">
        <h2>👋 欢迎使用 AI Chat</h2>
        <p>开始一段有趣的对话吧！</p>
      </div>
    `;
    return;
  }

  messagesContainer.innerHTML = '';
  
  chat.messages.forEach(msg => {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${msg.role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = msg.role === 'user' ? '🧑‍💻' : '🤖';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = msg.content;
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = msg.timestamp;
    
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = msg.role === 'user' ? 'flex-end' : 'flex-start';
  wrapper.style.width = '100%';
  wrapper.style.gap = '4px';
  wrapper.appendChild(content);
  wrapper.appendChild(time);
    
    // 用户消息：文本在左，头像在右；AI消息：头像在左，文本在右
    if (msg.role === 'user') {
      messageEl.appendChild(wrapper);
      messageEl.appendChild(avatar);
    } else {
      messageEl.appendChild(avatar);
      messageEl.appendChild(wrapper);
    }
    messagesContainer.appendChild(messageEl);
  });

  // 自动滚动到底部
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 清空当前对话
function clearCurrentChat() {
  if (confirm('确定要清空当前对话吗？')) {
    const chat = chatHistory[currentChatId];
    chat.messages = [];
    renderMessages();
  }
}

// 导出对话
function exportChat() {
  const chat = chatHistory[currentChatId];
  if (!chat || chat.messages.length === 0) {
    alert('对话为空，无法导出');
    return;
  }

  const content = formatChatForExport(chat);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `chat_${currentChatId}.txt`;
  link.click();
}

// 格式化对话用于导出
function formatChatForExport(chat) {
  let content = `=== ${chat.title} ===\n`;
  content += `创建时间: ${chat.createdAt}\n\n`;
  
  chat.messages.forEach(msg => {
    const role = msg.role === 'user' ? '👤 用户' : '🤖 AI';
    content += `[${msg.timestamp}] ${role}:\n`;
    content += `${msg.content}\n\n`;
  });

  return content;
}

// 加载聊天历史（从 localStorage）
function loadChatHistory() {
  const saved = localStorage.getItem('chatHistory');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      chatHistory = data.history;
      chatCounter = data.counter;
      
      if (Object.keys(chatHistory).length > 0) {
        currentChatId = Object.keys(chatHistory)[0];
        updateChatList();
        renderMessages();
        updateChatHeader();
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  }
}

// 保存聊天历史（到 localStorage）
function saveChatHistory() {
  localStorage.setItem('chatHistory', JSON.stringify({
    history: chatHistory,
    counter: chatCounter
  }));
}

// 定期保存对话
setInterval(() => {
  saveChatHistory();
}, 5000);

// 页面卸载时保存
window.addEventListener('beforeunload', () => {
  saveChatHistory();
});

// 启动应用
init();
