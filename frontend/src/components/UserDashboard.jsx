import React, { useState } from 'react';
import { User, MessageSquare, Loader2, Send } from 'lucide-react';

export default function UserDashboard({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMsg = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const res = await fetch('[http://127.0.0.1:5000/api/chat](http://127.0.0.1:5000/api/chat)', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.content })
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: `错误: ${data.message}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: '网络错误，请检查后端服务是否启动。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // UI 渲染逻辑 (与之前文档类似，略)
  return (
    <div className="p-8">
      <h2>您好, {currentUser.username}</h2>
      {/* 聊天窗口与输入框 */}
      {/* onClick 绑定 handleSendMessage */}
    </div>
  )
}