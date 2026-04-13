import React, { useState, useEffect } from 'react';
import { User, MessageSquare, Loader2, Send, Database } from 'lucide-react';

export default function UserDashboard({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 新增 RAG 模式状态
  const [useRag, setUseRag] = useState(false);
  const [hasKbFiles, setHasKbFiles] = useState(false);

  // 初始化时检查管理员是否已上传知识库文件
  useEffect(() => {
    const checkKbFiles = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/rag/files');
        const data = await res.json();
        if (data.status === 'success' && data.files && data.files.length > 0) {
          setHasKbFiles(true);
        } else {
          setHasKbFiles(false);
          setUseRag(false); // 强制关闭没有文件的 RAG
        }
      } catch (err) {
        console.error("检查知识库文件失败", err);
      }
    };
    checkKbFiles();
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMsg = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const res = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 发送给后端 RAG 开关状态
        body: JSON.stringify({ prompt: userMsg.content, use_rag: useRag })
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        const replyContent = typeof data.reply === 'object' ? JSON.stringify(data.reply, null, 2) : data.reply;
        setMessages(prev => [...prev, { role: 'model', content: replyContent }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: `❌ 错误: ${data.message}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: '⚠️ 网络错误，请检查 Flask 后端服务是否已启动 (5000端口)。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content) => {
    if (typeof content === 'object' && content !== null) {
      return JSON.stringify(content, null, 2);
    }
    return String(content);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto h-[calc(100vh-64px)] flex flex-col">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        {/* 头部信息和 RAG 开关 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">欢迎回来, {currentUser?.username || '用户'}</h2>
              <p className="text-gray-500 text-sm">您的专属大语言模型 Agent</p>
            </div>
          </div>
          
          {/* RAG 切换面板 */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
            <Database className={`w-4 h-4 ${useRag ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">本地知识库问答助手</span>
            <button 
              onClick={() => {
                if (!hasKbFiles) {
                  alert("管理员尚未上传知识库文件，目前无法使用本地检索功能。");
                  return;
                }
                setUseRag(!useRag);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${useRag ? 'bg-blue-600' : 'bg-gray-300'} ${!hasKbFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${useRag ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        
        {/* 聊天记录区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <MessageSquare className="w-12 h-12 text-gray-300" />
              <p>想聊点什么？可以问我任何问题。</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{renderMessageContent(msg.content)}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="text-sm text-gray-500 font-medium">Agent 正在思考并调用工具...</span>
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <div className="relative flex items-end gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea 
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none min-h-[56px] max-h-32"
                placeholder={useRag ? "输入您的问题，将仅从本地知识库中进行搜索与回答..." : "输入您的问题 (例如：北京今天的天气怎么样？)..."}
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
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="h-[56px] px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl cursor-pointer font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">发送</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}