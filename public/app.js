const API_BASE = 'http://localhost:3000/api';
const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const statusEl = document.getElementById('status');
const streamBtn = document.getElementById('streamBtn');
const normalBtn = document.getElementById('normalBtn');
const extractBtn = document.getElementById('extractBtn');
const clearBtn = document.getElementById('clearBtn');

function showStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = `status show ${type}`;
}

function hideStatus() {
  statusEl.className = 'status';
}

streamBtn.addEventListener('click', async () => {
  const input = inputEl.value.trim();
  if (!input) { 
    showStatus('请输入问题', 'error'); 
    return; 
  }
  
  outputEl.textContent = '';
  outputEl.classList.add('streaming');
  streamBtn.disabled = normalBtn.disabled = true;
  showStatus('正在连接...', 'info');

  try {
    const response = await fetch(`${API_BASE}/chain/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) { 
        showStatus('✅ 完成', 'success'); 
        break; 
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const json = JSON.parse(data);
            
            if (json.type === 'status') {
              showStatus(json.content.trim(), 'info');
            } else if (json.type === 'topic') {
              const div = document.createElement('div');
              div.className = 'topic';
              div.textContent = json.content;
              outputEl.appendChild(div);
            } else if (json.type === 'content') {
              outputEl.textContent += json.content;
              outputEl.scrollTop = outputEl.scrollHeight;
            } else if (json.type === 'error') {
              showStatus(`❌ 错误: ${json.content}`, 'error');
            }
          } catch (e) {
            console.error('解析 JSON 失败:', e, data);
          }
        }
      }
    }
  } catch (error) {
    showStatus(`❌ ${error.message}`, 'error');
    outputEl.textContent = `错误: ${error.message}`;
  } finally {
    outputEl.classList.remove('streaming');
    streamBtn.disabled = normalBtn.disabled = false;
  }
});

normalBtn.addEventListener('click', async () => {
  const input = inputEl.value.trim();
  if (!input) { 
    showStatus('请输入问题', 'error'); 
    return; 
  }
  
  outputEl.textContent = '';
  streamBtn.disabled = normalBtn.disabled = true;
  showStatus('处理中...', 'info');

  try {
    const response = await fetch(`${API_BASE}/chain/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });
    
    const result = await response.json();
    
    if (result.success) {
      outputEl.textContent = result.data;
      showStatus('✅ 完成', 'success');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showStatus(`❌ ${error.message}`, 'error');
    outputEl.textContent = `错误: ${error.message}`;
  } finally {
    streamBtn.disabled = normalBtn.disabled = false;
  }
});

clearBtn.addEventListener('click', () => {
  outputEl.textContent = '';
  hideStatus();
});

extractBtn.addEventListener('click', async () => {
  const input = inputEl.value.trim();
  if (!input) { 
    showStatus('请输入问题', 'error'); 
    return; 
  }
  
  outputEl.textContent = '';
  streamBtn.disabled = normalBtn.disabled = extractBtn.disabled = true;
  showStatus('正在提取关键词...', 'info');

  try {
    const response = await fetch(`${API_BASE}/chain/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const keywords = result.data;
      const keywordList = document.createElement('div');
      keywordList.className = 'keyword-list';
      
      if (typeof keywords === 'string') {
        keywordList.textContent = keywords;
      } else if (Array.isArray(keywords)) {
        keywords.forEach(keyword => {
          const tag = document.createElement('span');
          tag.className = 'keyword-tag';
          tag.textContent = keyword;
          keywordList.appendChild(tag);
        });
      } else if (typeof keywords === 'object') {
        keywordList.textContent = JSON.stringify(keywords, null, 2);
      }
      
      outputEl.appendChild(keywordList);
      showStatus('✅ 关键词提取完成', 'success');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showStatus(`❌ ${error.message}`, 'error');
    outputEl.textContent = `错误: ${error.message}`;
  } finally {
    streamBtn.disabled = normalBtn.disabled = extractBtn.disabled = false;
  }
});

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    streamBtn.click();
  }
});
