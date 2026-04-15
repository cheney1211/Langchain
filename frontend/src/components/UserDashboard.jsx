import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/authFetch.js';// 引入 axios 实例

const UserDashboard = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // 初始化时从 localStorage 读取 RAG 状态，默认为 false
    const [useRag, setUseRag] = useState(() => {
        const savedRag = localStorage.getItem('use_rag_setting');
        return savedRag === 'true';
    });
    
    // 历史会话状态
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    // 监听状态变化并同步到 localStorage
    useEffect(() => {
        localStorage.setItem('use_rag_setting', useRag);
    }, [useRag]);

    // 初始加载历史会话列表
    useEffect(() => {
        fetchSessions();
    }, []);

    // 每次消息更新后，自动滚动到最底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // 获取会话列表
    const fetchSessions = async () => {
        try {
            const res = await api.get('/history/sessions'); 
            if (res.status === 200) {
                const data = res.data;
                if (data.status === 'success') {
                    setSessions(data.sessions);
                }
            }
        } catch (error) {
            console.error("无法获取会话列表", error);
        }
    };

    // 加载单个会话的历史消息
    const loadSession = async (sessionId) => {
        setCurrentSessionId(sessionId);
        try {
            const res = await api.get(`/history/sessions/${sessionId}/messages`);
            if (res.status === 200) {
                const data = res.data;
                if (data.status === 'success') {
                    setMessages(data.messages);
                }
            }
        } catch (error) {
            console.error("加载消息失败", error);
        }
    };

    // 新建对话
    const handleNewSession = () => {
        setCurrentSessionId(null);
        setMessages([]);
    };

    // 发送消息
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        setInput('');
        
        // 乐观更新 UI
        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setIsLoading(true);

        try {
            // 使用你的 axios 实例发送 POST 请求
            // axios 默认会将第二个参数转换为 JSON，并自动带上 application/json 头
            const res = await api.post('/chat', {
                prompt: userText,
                use_rag: useRag,
                session_id: currentSessionId // 将当前的会话 ID 发给后端
            });
            
            const data = res.data;
            
            if (data.status === 'success') {
                setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
                
                // 如果这是一个新对话，后端会返回新生成的 session_id
                if (data.session_id && currentSessionId !== data.session_id) {
                    setCurrentSessionId(data.session_id);
                    fetchSessions(); // 刷新左侧会话列表以显示新对话
                }
            } else {
                setMessages(prev => [...prev, { role: 'model', content: '请求出错: ' + data.message }]);
            }
        } catch (error) {
            console.error("发送消息出错:", error);
            setMessages(prev => [...prev, { role: 'model', content: '网络错误，请稍后再试。' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
            {/* 左侧边栏 - 会话列表 */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-gray-200">
                    <button 
                        onClick={handleNewSession}
                        className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
                    >
                        <span>+ 新建对话</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sessions.length === 0 && (
                        <div className="text-center text-gray-400 mt-4 text-sm">暂无历史对话</div>
                    )}
                    {sessions.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => loadSession(s.id)}
                            className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 text-sm truncate transition
                                ${currentSessionId === s.id ? 'bg-blue-50 border-l-4 border-l-blue-600 text-blue-800 font-medium' : 'text-gray-600'}`}
                        >
                            {s.title}
                        </div>
                    ))}
                </div>
            </div>

            {/* 右侧 - 聊天主区域 */}
            <div className="flex-1 flex flex-col">
                {/* 顶部控制栏 */}
                <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
                    <h2 className="font-semibold text-gray-800">
                        {currentSessionId ? "历史对话" : "新对话"}
                    </h2>
                    <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-100 transition">
                        <input 
                            type="checkbox" 
                            checked={useRag} 
                            onChange={(e) => setUseRag(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">启用知识库增强 (RAG)</span>
                    </label>
                </div>

                {/* 消息展示区 */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <div className="text-5xl">👋</div>
                            <p>开始一次新的 AI 对话吧！</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                }`}>
                                    <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
                                        {msg.content}
                                    </pre>
                                </div>
                            </div>
                        ))
                    )}
                    
                    {/* 加载中的骨架动画 */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex space-x-2 items-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* 底部输入区 */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex space-x-4">
                        <input 
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder="输入你想问的问题..." 
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !input.trim()}
                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition shadow-sm"
                        >
                            发送
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;