import React, { useState } from 'react';
import { Bot, Shield, User, LogOut } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {currentUser && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          {/* 导航栏代码，包含退出登录按钮 */}
        </nav>
      )}

      <main>
        {view === 'login' && <AuthScreen isLogin={true} setView={setView} setCurrentUser={setCurrentUser} />}
        {view === 'register' && <AuthScreen isLogin={false} setView={setView} setCurrentUser={setCurrentUser} />}
        {view === 'dashboard' && currentUser?.role === 'user' && <UserDashboard currentUser={currentUser} />}
        {view === 'dashboard' && currentUser?.role === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
}
