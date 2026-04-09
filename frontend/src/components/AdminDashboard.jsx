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
    <div className="p-8">
      <h2>搜索工具 API 配置</h2>
      <form onSubmit={handleSave}>
        <div>
          <label>
            <input type="radio" value="serpapi" checked={provider === 'serpapi'} onChange={e => setProvider(e.target.value)} /> 
            SerpAPI
          </label>
          <label className="ml-4">
            <input type="radio" value="tavily" checked={provider === 'tavily'} onChange={e => setProvider(e.target.value)} /> 
            Tavily
          </label>
        </div>
        <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">保存配置</button>
      </form>
    </div>
  );
}
