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
const loadingIndicator = document.getElementById('loadingIndicator');

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
    if (e.key === 'Enter' && e.ctrlKey) {
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
    chatItem.textContent = chat.title;
    
    chatItem.addEventListener('click', () => {
      currentChatId = chat.id;
      updateChatList();
      renderMessages();
      updateChatHeader();
    });
    
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
  const message = messageInput.value.trim();
  
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
  showLoading(true);
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
    showLoading(false);
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

// 流式响应
async function streamResponse(message, endpoint) {
  const chat = chatHistory[currentChatId];
  // 获取当前对话的历史消息（不包括最后一条 AI 消息的占位符）
  const historyMessages = chat.messages.slice(0, -1);
  
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
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

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
            updateLastMessage(aiMessage);
          } else if (json.error) {
            console.error('Stream error:', json.error);
          }
        } catch (e) {
          console.error('Failed to parse JSON:', e);
        }
      }
    }
  }
}

// 普通响应
async function normalResponse(message, endpoint) {
  const chat = chatHistory[currentChatId];
  // 获取当前对话的历史消息
  const historyMessages = chat.messages.slice(0, -1);
  
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

// 更新最后一条消息
function updateLastMessage(content) {
  const chat = chatHistory[currentChatId];
  if (chat.messages.length > 0) {
    chat.messages[chat.messages.length - 1].content = content;
    renderMessages();
    // 自动滚动到底部
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
    avatar.textContent = msg.role === 'user' ? '👤' : '🤖';
    
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
    wrapper.style.gap = '4px';
    wrapper.appendChild(content);
    wrapper.appendChild(time);
    
    messageEl.appendChild(avatar);
    messageEl.appendChild(wrapper);
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

// 显示/隐藏加载指示器
function showLoading(show) {
  if (show) {
    loadingIndicator.classList.add('show');
  } else {
    loadingIndicator.classList.remove('show');
  }
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
