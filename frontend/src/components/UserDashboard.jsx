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
    <div className="p-4 md:p-8 max-w-5xl mx-auto h-[calc(100vh-64px)] flex flex-col">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
          {/* 头部信息 */}
          <div className="flex items-center gap-4 p-6 border-b border-gray-100 shrink-0">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">欢迎回来, {currentUser.username}</h2>
              <p className="text-gray-500 text-sm">您的专属 AI 助手</p>
            </div>
          </div>
          
          {/* 聊天记录区域 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <MessageSquare className="w-12 h-12 text-gray-300" />
                <p>想聊点什么？输入问题，或使用 ✨ 润色您的提示词。</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  <span className="text-sm text-gray-500 font-medium">AI 正在飞速思考中...</span>
                </div>
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            <div className="relative flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea 
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none min-h-[56px] max-h-32"
                  placeholder="输入您的问题..."
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button 
                  onClick={handlePolishPrompt}
                  disabled={!inputText.trim() || isPolishing || isLoading}
                  className="absolute right-2 bottom-2 p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent group"
                >
                  {isPolishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  <span className="absolute -top-10 right-0 bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-lg">
                    ✨ 智能润色提示词
                  </span>
                </button>
              </div>
              <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className="h-[56px] px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">发送</span>
              </button>
            </div>
            <div className="max-w-4xl mx-auto mt-2 text-center">
              <p className="text-xs text-gray-400">试试输入一个简短的问题（例如："写一封请假邮件"），然后点击 ✨ 魔法棒润色它！</p>
            </div>
          </div>
        </div>
      </div>
  )
}