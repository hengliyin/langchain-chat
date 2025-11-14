/**
 * 集成测试: 对话历史功能
 * 测试 AI 是否能记住之前的对话内容
 * 
 * 使用方法:
 * npm run test:conversation
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

async function testConversationMemory() {
  console.log('🧪 开始测试对话历史功能...\n');
  console.log(`📍 API 地址: ${API_BASE}\n`);

  const testMessages = [
    { message: '我叫hengliyin', description: '用户介绍自己' },
    { message: '我喜欢编程和旅游', description: '用户分享爱好' },
    { message: '我叫什么名字？我的爱好是什么？', description: '测试 AI 是否记得之前的信息' },
  ];

  let conversationHistory = [];
  let passedTests = 0;
  let totalTests = testMessages.length;

  for (let i = 0; i < testMessages.length; i++) {
    const { message, description } = testMessages[i];
    console.log(`📝 第 ${i + 1} 条消息: ${description}`);
    console.log(`   用户: ${message}`);

    try {
        const body = JSON.stringify({
          message,
          model: 'gpt-4o-mini',
          temperature: 0.7,
          history: conversationHistory
        })
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const aiResponse = result.data;
        console.log(`   AI: ${aiResponse}\n`);
        passedTests++;

        // 将本轮对话添加到历史中
        conversationHistory.push({ role: 'user', content: message });
        conversationHistory.push({ role: 'ai', content: aiResponse });
      } else {
        console.error(`   ❌ 错误: ${result.message}\n`);
      }
    } catch (error) {
      console.error(`   ❌ 请求失败: ${error.message}\n`);
      console.log('💡 确保服务器正在运行:');
      console.log('   npm run dev\n');
      process.exit(1);
    }
  }

  // 输出测试结果
  console.log('════════════════════════════════════════════════════════════');
  console.log('📊 测试结果汇总');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}/${totalTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (passedTests === totalTests) {
    console.log('✅ 所有测试通过！对话历史功能正常工作。\n');
  } else {
    console.log(`⚠️  有 ${totalTests - passedTests} 条测试未通过。\n`);
  }

  console.log('════════════════════════════════════════════════════════════');
  console.log('📋 完整的对话历史');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(JSON.stringify(conversationHistory, null, 2));
  console.log('\n════════════════════════════════════════════════════════════\n');

  // 返回适当的退出码
  process.exit(passedTests === totalTests ? 0 : 1);
}

// 运行测试
testConversationMemory();
