import React, { useState, useEffect } from 'react';
import { Bot, Shield, User, LogOut, Sparkles } from 'lucide-react';

// 引入拆分的组件
import AuthScreen from './components/AuthScreen';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import api from './utils/authFetch'; // 引入全新的 axios api 实例

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (accessToken && savedUser) {
        try {
          // Axios 请求直接返回 data，无需 .json()
          const res = await api.get('/me');
          if (res.data && res.data.status === 'success') {
            setCurrentUser(res.data.user);
            setView('dashboard');
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error("Token 初始化验证失败", error);
          handleLogout();
        }
      }
      setIsInitializing(false);
    };

    initAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setView('login');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-blue-200/80 text-sm tracking-wide animate-pulse">正在验证身份信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 font-sans text-gray-800 flex flex-col">
      {currentUser && (
        <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10 shadow-sm shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg animate-pulse"></div>
                  <Bot className="w-7 h-7 text-blue-600 relative" />
                </div>
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">大模型代理控制台</span>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5 bg-gradient-to-r from-gray-50 to-gray-100/80 px-3 py-1.5 rounded-full border border-gray-200/60 shadow-sm">
                  {currentUser.role === 'admin' ? (
                    <Shield className="w-4 h-4 text-amber-500" />
                  ) : (
                    <User className="w-4 h-4 text-blue-500" />
                  )}
                  {currentUser.username}
                </span>

                <button
                  onClick={handleLogout}
                  className="group flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> 退出
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1">
        {view === 'login' && <AuthScreen isLogin={true} setView={setView} setCurrentUser={setCurrentUser} />}
        {view === 'register' && <AuthScreen isLogin={false} setView={setView} setCurrentUser={setCurrentUser} />}
        {view === 'dashboard' && currentUser?.role === 'user' && <UserDashboard currentUser={currentUser} />}
        {view === 'dashboard' && currentUser?.role === 'admin' && <AdminDashboard currentUser={currentUser} />}
      </main>
      
    </div>
  );
}