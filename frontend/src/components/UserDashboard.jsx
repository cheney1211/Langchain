import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Bot, User, Plus, MessageSquare, Search, Send } from 'lucide-react';
import api from '../utils/authFetch.js';

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

    // 删除历史对话
    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation(); // 阻止事件冒泡，避免点击删除时触发加载对话的 onClick

        if (!window.confirm("确定要删除此历史对话吗？删除后将无法恢复。")) {
            return;
        }

        try {
            const res = await api.delete(`/history/sessions/${sessionId}`);
            if (res.data.status === 'success') {
                // 前端状态中移除被删除的会话
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                
                // 如果删除的是当前正在查看的会话，则重置回“新对话”状态
                if (currentSessionId === sessionId) {
                    handleNewSession();
                }
            } else {
                alert(`删除失败: ${res.data.message}`);
            }
        } catch (error) {
            console.error("删除会话出错:", error);
            alert("网络错误，删除失败，请稍后再试。");
        }
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
        <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50/30">
            {/* 左侧边栏 - 会话列表 */}
            <div className="w-72 bg-gradient-to-b from-slate-50 to-white border-r border-gray-200/60 flex flex-col hidden md:flex shadow-inner">
                <div className="p-4 border-b border-gray-200/60 bg-white/50 backdrop-blur-sm">
                    <button
                        onClick={handleNewSession}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all font-medium active:translate-y-0 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> 新建对话
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                    {sessions.length === 0 && (
                        <div className="text-center py-12 px-4">
                            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">暂无历史对话</p>
                        </div>
                    )}
                    {sessions.map(s => (
                        <div
                            key={s.id}
                            onClick={() => loadSession(s.id)}
                            className={`group flex items-center justify-between px-4 py-3 mx-2 rounded-xl cursor-pointer border transition-all
                                ${currentSessionId === s.id
                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800 shadow-sm'
                                    : 'border-transparent hover:bg-gray-50 text-gray-600'}`}
                        >
                            <span className="truncate pr-2 text-sm">{s.title}</span>
                            <button
                                onClick={(e) => handleDeleteSession(e, s.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all flex-shrink-0"
                                title="删除此对话"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 右侧 - 聊天主区域 */}
            <div className="flex-1 flex flex-col">
                {/* 顶部控制栏 */}
                <div className="px-6 py-3 border-b border-gray-200/60 bg-white/60 backdrop-blur-sm flex justify-between items-center shadow-sm z-10">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        {currentSessionId ? "历史对话" : "新对话"}
                    </h2>
                    <label className="flex items-center gap-2.5 cursor-pointer bg-gradient-to-r from-gray-50 to-white px-4 py-2 rounded-full border border-gray-200/60 hover:border-blue-200 hover:shadow-sm transition-all">
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${useRag ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-300'}`}>
                            <input
                                type="checkbox"
                                checked={useRag}
                                onChange={(e) => setUseRag(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${useRag ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                        <Search className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">知识库增强 (RAG)</span>
                    </label>
                </div>

                {/* 消息展示区 */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-6 animate-fade-in">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl animate-pulse-ring"></div>
                                <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full p-6 shadow-lg shadow-blue-500/20">
                                    <Bot className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-semibold text-gray-700 mb-2">你好，有什么我可以帮你的？</p>
                                <p className="text-sm text-gray-400">开启 RAG 模式可使用本地知识库，但将无法联网</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-br from-gray-500 to-gray-600'
                                            : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                                    }`}>
                                        {msg.role === 'user' ? (
                                            <User className="w-4 h-4 text-white" />
                                        ) : (
                                            <Bot className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    {/* Message bubble */}
                                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-md'
                                            : 'bg-white border border-gray-200/60 text-gray-800 rounded-bl-md'
                                    }`}>
                                        <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed bg-transparent">
                                            {msg.content}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* 加载中的动画 */}
                    {isLoading && (
                        <div className="flex justify-start animate-slide-up">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                                    <Bot className="w-4 h-4 text-white animate-pulse" />
                                </div>
                                <div className="bg-white border border-gray-200/60 px-5 py-4 rounded-2xl rounded-bl-md shadow-sm flex items-center space-x-2">
                                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce"></div>
                                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* 底部输入区 */}
                <div className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-t border-gray-200/60">
                    <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="输入你想问的问题..."
                            className="flex-1 px-5 py-3.5 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm bg-white/80 backdrop-blur-sm text-gray-800 placeholder-gray-400 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-2xl hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/20 disabled:from-blue-300 disabled:to-indigo-300 disabled:shadow-none disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            发送
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;