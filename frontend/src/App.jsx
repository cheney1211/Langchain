import React, { useState } from 'react';
import { Bot, Shield, User, LogOut } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 

  // 退出登录的处理函数
  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      
      {/* 全局顶部导航栏 (仅在有用户登录时显示) */}
      {currentUser && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-xl tracking-tight text-gray-900">大模型代理控制台</span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* 身份标识 */}
                <span className="text-sm text-gray-600 flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                  {currentUser.role === 'admin' ? (
                    <Shield className="w-4 h-4 text-orange-500" />
                  ) : (
                    <User className="w-4 h-4 text-blue-500" />
                  )}
                  {currentUser.username}
                </span>
                
                {/* 退出按钮 */}
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

      {/* 动态视图渲染区 */}
      <main className="flex-1">
        {view === 'login' && <AuthScreen isLogin={true} setView={setView} setCurrentUser={setCurrentUser} />}
        {view === 'register' && <AuthScreen isLogin={false} setView={setView} setCurrentUser={setCurrentUser} />}
        {view === 'dashboard' && currentUser?.role === 'user' && <UserDashboard currentUser={currentUser} />}
        {view === 'dashboard' && currentUser?.role === 'admin' && <AdminDashboard />}
      </main>
      
    </div>
  );
}