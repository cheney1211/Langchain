import React, { useState } from 'react';
import { User, Shield, AlertCircle, CheckCircle2, Bot } from 'lucide-react';

export default function AuthScreen({ isLogin, setView, setCurrentUser }) {
  const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? 'http://localhost:5000/api/login' : 'http://localhost:5000/api/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || '请求失败');

      if (isLogin) {
        setCurrentUser(data.user);
        setView('dashboard');
      } else {
        setSuccess('注册成功！');
        setTimeout(() => setView('login'), 1500);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    // ... 原来的表单 JSX 代码 (保留角色选择器和输入框) ...
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-blue-600 p-6 text-center">
            <Bot className="w-12 h-12 text-white mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-white">大模型智能代理平台</h2>
            <p className="text-blue-200 mt-1">{isLogin ? '欢迎回来，请登录' : '创建您的账号'}</p>
          </div>
          
          <div className="p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2 border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-start gap-2 border border-green-100">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 角色选择器 - 核心需求 */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${formData.role === 'user' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setFormData({...formData, role: 'user'})}
                >
                  <User className="w-4 h-4" /> 普通用户
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${formData.role === 'admin' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setFormData({...formData, role: 'admin'})}
                >
                  <Shield className="w-4 h-4" /> 管理员
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="请输入密码"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {isLogin ? '登录' : '注册账号'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              {isLogin ? (
                <p>
                  还没有账号？ 
                  <button onClick={() => {setView('register'); setError('');}} className="text-blue-600 font-medium hover:underline ml-1">
                    立即注册
                  </button>
                </p>
              ) : (
                <p>
                  已有账号？ 
                  <button onClick={() => {setView('login'); setError('');}} className="text-blue-600 font-medium hover:underline ml-1">
                    返回登录
                  </button>
                </p>
              )}
            </div>
            
            {/* 提示测试账号信息 */}
            {isLogin && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 border border-dashed border-gray-300">
                <p className="font-semibold mb-1 text-gray-700">测试账号 (密码均为 123):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>普通用户: admin (需选管理员角色)</li>
                  <li>管理员: user (需选普通用户角色)</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}