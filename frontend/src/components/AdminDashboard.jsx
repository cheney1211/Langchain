import React, { useState, useEffect } from 'react';
import { Shield, Search, Globe, Settings, CheckCircle2, Bot, User } from 'lucide-react';

export default function AdminDashboard() {
  const [provider, setProvider] = useState('serpapi');
  const [saveStatus, setSaveStatus] = useState('');

  // 挂载时从 Flask 后端获取当前配置
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.provider) {
          setProvider(data.provider);
        }
      })
      .catch(err => console.error("配置获取失败:", err));
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:5000/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSaveStatus(data.message || '保存成功！');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      alert("网络错误，无法连接后端");
    }
  };

  return (
   <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          管理员控制台
        </h2>
        <p className="text-gray-500 mt-2">管理系统级配置和底层大模型联网工具选项。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧侧边栏 */}
        <div className="col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 font-medium rounded-xl transition-colors">
            <Search className="w-5 h-5" /> 搜索工具配置
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 font-medium rounded-xl transition-colors">
            <Bot className="w-5 h-5" /> 知识库 (RAG) 设置
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 font-medium rounded-xl transition-colors">
            <User className="w-5 h-5" /> 用户管理
          </button>
        </div>

        {/* 右侧主内容区：搜索工具配置 */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-500" />
                大模型 Agent 搜索引擎切换
              </h3>
            </div>
            
            <div className="p-6">
              {saveStatus && (
                <div className="mb-6 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2 border border-green-100">
                  <CheckCircle2 className="w-5 h-5" />
                  {saveStatus}
                </div>
              )}

              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    当前启用的网络搜索节点
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label 
                      className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                        provider === 'serpapi' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                          : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="searchProvider" 
                        className="sr-only"
                        value="serpapi"
                        checked={provider === 'serpapi'}
                        onChange={(e) => setProvider(e.target.value)}
                      />
                      <span className="font-bold text-lg">SerpAPI</span>
                      <span className="text-xs opacity-70">Google 搜索代理核心</span>
                    </label>

                    <label 
                      className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                        provider === 'tavily' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                          : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="searchProvider" 
                        className="sr-only"
                        value="tavily"
                        checked={provider === 'tavily'}
                        onChange={(e) => setProvider(e.target.value)}
                      />
                      <span className="font-bold text-lg">Tavily</span>
                      <span className="text-xs opacity-70">AI 专用的高级搜索引擎</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">注意：您的秘钥在后端的 <code>.env</code> 文件中统一管理，此处仅用于动态切换工具引擎。</p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    保存配置并生效
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
