import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [provider, setProvider] = useState('serpapi');
  
  useEffect(() => {
    fetch('[http://127.0.0.1:5000/api/config](http://127.0.0.1:5000/api/config)')
      .then(res => res.json())
      .then(data => setProvider(data.provider));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await fetch('[http://127.0.0.1:5000/api/config](http://127.0.0.1:5000/api/config)', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    });
    alert(`已将搜索引擎切换为: ${provider}`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            管理员控制台
          </h2>
          <p className="text-gray-500 mt-2">管理系统级配置和底层 API 调用选项。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧侧边栏 */}
          <div className="col-span-1 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 font-medium rounded-xl transition-colors">
              <Search className="w-5 h-5" />
              搜索工具配置
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 font-medium rounded-xl transition-colors">
              <Bot className="w-5 h-5" />
              大模型参数设置
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 font-medium rounded-xl transition-colors">
              <User className="w-5 h-5" />
              用户管理
            </button>
          </div>

          {/* 右侧主内容区：搜索工具配置 */}
          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-500" />
                  大模型联网搜索工具 API 配置
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
                  {/* 选择搜索引擎提供商 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      当前使用的搜索引擎 API
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {['google', 'bing', 'duckduckgo'].map((provider) => (
                        <label 
                          key={provider} 
                          className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                            localConfig.provider === provider 
                              ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                              : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="searchProvider" 
                            className="sr-only"
                            value={provider}
                            checked={localConfig.provider === provider}
                            onChange={(e) => setLocalConfig({...localConfig, provider: e.target.value})}
                          />
                          <span className="capitalize font-medium">{
                            provider === 'google' ? 'Google Search' : 
                            provider === 'bing' ? 'Bing Web Search' : 'DuckDuckGo API'
                          }</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 对应的 API Key 输入 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <Key className="w-4 h-4 text-gray-500" /> API Key
                      </label>
                      <input 
                        type="password" 
                        value={localConfig.apiKey}
                        onChange={(e) => setLocalConfig({...localConfig, apiKey: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder={`请输入 ${localConfig.provider} 的 API Key`}
                      />
                      <p className="text-xs text-gray-500 mt-1">此密钥将由后端服务安全调用，供大模型检索互联网信息时使用。</p>
                    </div>

                    {localConfig.provider === 'google' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Search Engine ID (CX)
                        </label>
                        <input 
                          type="text" 
                          value={localConfig.searchEngineId}
                          onChange={(e) => setLocalConfig({...localConfig, searchEngineId: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                          placeholder="请输入 Google Programmable Search Engine ID"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      保存配置
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
