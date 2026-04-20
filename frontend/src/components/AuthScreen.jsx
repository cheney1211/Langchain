import React, { useState } from 'react';
import { User, Shield, AlertCircle, CheckCircle2, Bot, Sparkles, ArrowRight, Zap, Brain, Globe } from 'lucide-react';
import axios from 'axios';

export default function AuthScreen({ isLogin, setView, setCurrentUser }) {
  const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? 'http://127.0.0.1:5000/api/login' : 'http://127.0.0.1:5000/api/register';

    try {
      const res = await axios.post(endpoint, formData);
      const data = res.data;

      if (isLogin) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setCurrentUser(data.user);
        setView('dashboard');
      } else {
        setSuccess('注册成功！');
        setTimeout(() => setView('login'), 1500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || '请求失败';
      setError(errorMessage);
    }
  };

  const features = [
    { icon: Brain, label: '智能对话' },
    { icon: Globe, label: '联网搜索' },
    { icon: Zap, label: 'RAG 增强' },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden">
      {/* Floating decorative orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl animate-float-slow"></div>

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center px-12">
        <div className="animate-slide-in-left">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400/30 rounded-2xl blur-xl"></div>
              <Bot className="w-12 h-12 text-blue-400 relative" />
            </div>
            <span className="text-2xl font-bold text-white">大模型智能代理平台</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            让 AI 成为你的<br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">智能工作伙伴</span>
          </h1>

          <p className="text-blue-200/70 text-lg mb-10 max-w-md">
            融合大语言模型、RAG 知识库与联网搜索能力，打造你的专属 AI 代理
          </p>

          <div className="flex gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-4 hover:bg-white/10 transition-colors">
                <f.icon className="w-6 h-6 text-blue-400" />
                <span className="text-sm text-blue-200/80">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-slide-up">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 text-center">
              <div className="lg:hidden flex justify-center mb-4">
                <Bot className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">{isLogin ? '欢迎回来' : '创建账号'}</h2>
              <p className="text-blue-200/60 mt-1 text-sm">{isLogin ? '登录以继续你的 AI 之旅' : '填写以下信息完成注册'}</p>
            </div>

            <div className="px-8 pb-8">
              {/* Alerts */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 backdrop-blur-sm text-red-200 text-sm rounded-xl flex items-start gap-2 border border-red-500/30 animate-bounce-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-emerald-500/20 backdrop-blur-sm text-emerald-200 text-sm rounded-xl flex items-start gap-2 border border-emerald-500/30 animate-bounce-in">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* Role selector */}
              <div className="flex bg-white/5 backdrop-blur-sm border border-white/10 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${formData.role === 'user' ? 'bg-white/15 text-white shadow-lg' : 'text-blue-200/60 hover:text-blue-200/90'}`}
                  onClick={() => setFormData({...formData, role: 'user'})}
                >
                  <User className="w-4 h-4" /> 普通用户
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${formData.role === 'admin' ? 'bg-white/15 text-white shadow-lg' : 'text-blue-200/60 hover:text-blue-200/90'}`}
                  onClick={() => setFormData({...formData, role: 'admin'})}
                >
                  <Shield className="w-4 h-4" /> 管理员
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-blue-200/80 mb-2">用户名</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    placeholder="请输入用户名"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200/80 mb-2">密码</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    placeholder="请输入密码"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <button
                  type="submit"
                  className="group w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLogin ? '登录' : '注册账号'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              {/* Toggle login/register */}
              <div className="mt-6 text-center text-sm text-blue-200/60">
                {isLogin ? (
                  <p>
                    还没有账号？
                    <button onClick={() => {setView('register'); setError('');}} className="text-blue-300 font-medium hover:text-blue-200 ml-1 transition-colors cursor-pointer">
                      立即注册
                    </button>
                  </p>
                ) : (
                  <p>
                    已有账号？
                    <button onClick={() => {setView('login'); setError('');}} className="text-blue-300 font-medium hover:text-blue-200 ml-1 transition-colors cursor-pointer">
                      返回登录
                    </button>
                  </p>
                )}
              </div>

              {/* Test accounts */}
              {isLogin && (
                <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 text-xs text-blue-200/50">
                  <p className="font-semibold mb-2 text-blue-200/70 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> 测试账号 (密码均为 123)
                  </p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-amber-400" /> 管理员: admin
                    </li>
                    <li className="flex items-center gap-2">
                      <User className="w-3 h-3 text-blue-400" /> 普通用户: user
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}