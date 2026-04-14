import React, { useState, useEffect } from 'react';
import { Bot, Shield, User, LogOut } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        正在验证身份信息...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      {currentUser && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-xl tracking-tight text-gray-900">大模型代理控制台</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                  {currentUser.role === 'admin' ? (
                    <Shield className="w-4 h-4 text-orange-500" />
                  ) : (
                    <User className="w-4 h-4 text-blue-500" />
                  )}
                  {currentUser.username}
                </span>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> 退出
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