import React, { useState, useEffect } from 'react';
import { Shield, Search, Globe, Settings, CheckCircle2, Bot, User, UploadCloud, FileText, Trash2, Loader2, Users, BarChart3, Database, KeyRound, ChevronRight } from 'lucide-react';
import api from '../utils/authFetch';

export default function AdminDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('search'); 
  const [provider, setProvider] = useState(() => {
    return localStorage.getItem('admin_search_provider') || 'serpapi';
  });
  const [saveStatus, setSaveStatus] = useState('');
  
  const [kbFiles, setKbFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const allowedExtensions = [
    '.pdf', '.txt', '.md', '.docx', '.xlsx', '.xls', 
    '.pptx', '.csv', '.py', '.js', '.html', '.css'
  ];

  // 监听并缓存搜索提供商配置
  useEffect(() => {
    localStorage.setItem('admin_search_provider', provider);
  }, [provider]);

  useEffect(() => {
    api.get('/admin_config')
      .then(res => {
        if (res.data && res.data.provider) {
          setProvider(res.data.provider);
        }
      })
      .catch(err => console.error("配置获取失败:", err));
  }, []);

  useEffect(() => {
    if (activeTab === 'rag') fetchKbFiles();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const showToast = (message) => {
    setSaveStatus(message);
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin_config', { provider });
      showToast(res.data.message || '保存成功！');
    } catch (err) {
      alert(err.response?.data?.message || "网络错误，无法连接后端");
    }
  };

  const fetchKbFiles = async () => {
    try {
      const res = await api.get('/rag/files');
      if (res.data.status === 'success') {
        setKbFiles(res.data.files);
      }
    } catch (err) {
      console.error("获取知识库文件失败:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
      alert("不支持的文件格式！支持的格式包括: \n" + allowedExtensions.join(', '));
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);
    try {
      // Axios 实例会自动去除 Content-Type 让浏览器自行根据 FormData 加上 boundary
      const res = await api.post('/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      if (res.data.status === 'success') {
        showToast('知识库文件上传成功，系统正在后台构建向量库！');
        fetchKbFiles(); 
      } else {
        alert(`上传失败: ${res.data.message}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "网络错误，上传失败");
    } finally {
      setIsUploading(false);
      e.target.value = ''; 
    }
  };

  const handleDeleteFile = async (filename) => {
    if (!window.confirm(`确定要从知识库中删除 "${filename}" 吗？\n注意: 删除后系统会自动在后台同步重构向量库。`)) return;

    try {
      const res = await api.delete(`/rag/files/${filename}`);
      
      if (res.data.status === 'success') {
        showToast(`文件 ${filename} 已删除，正在同步后台库。`);
        fetchKbFiles(); 
      } else {
        alert(`删除失败: ${res.data.message}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "网络错误，删除失败");
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.get('/admin/users');
      if (res.data.status === 'success') {
        setUsers(res.data.users);
      } else {
        console.error("获取用户失败:", res.data.message);
      }
    } catch (err) {
      console.error("获取用户列表失败:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.status === 'success') {
        showToast('用户角色已更新');
        fetchUsers();
      } else {
        alert(`更新失败: ${res.data.message}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "网络错误，更新失败");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`确认要永久删除用户 "${username}" 吗？此操作无法撤销。`)) return;

    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.status === 'success') {
        showToast(`用户 ${username} 已被删除`);
        fetchUsers();
      } else {
        alert(`删除失败: ${res.data.message}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "网络错误，删除失败");
    }
  };

  const tabConfig = [
    { id: 'search', icon: Search, label: '搜索工具配置', description: '配置联网搜索引擎' },
    { id: 'rag', icon: Database, label: '知识库 (RAG)', description: '管理本地文档' },
    { id: 'users', icon: Users, label: '用户管理', description: '账号与权限管理' },
  ];

  return (
   <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg"></div>
            <Shield className="w-8 h-8 text-blue-600 relative" />
          </div>
          管理员控制台
        </h2>
        <p className="text-gray-500 mt-2 text-sm">管理系统级配置、大模型联网工具选项、本地知识库以及账号管理。</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-slide-up">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">搜索引擎</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 capitalize">{provider}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">知识库文档</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{kbFiles.length} 篇</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">注册用户</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{users.length} 人</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar navigation */}
        <div className="col-span-1 space-y-1">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-600 hover:bg-gray-100/80'
              }`}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="font-medium text-sm">{tab.label}</span>
                <span className={`block text-xs ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-400'}`}>{tab.description}</span>
              </div>
              <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${activeTab === tab.id ? 'translate-x-0' : '-translate-x-1 opacity-0'}`} />
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="col-span-1 lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden min-h-[400px]">
            {/* Toast notification */}
            {saveStatus && (
              <div className="m-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl flex items-center gap-2 border border-emerald-200 animate-slide-up">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                {saveStatus}
              </div>
            )}

            {activeTab === 'search' && (
              <>
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-800">大模型 Agent 搜索引擎切换</h3>
                </div>
                <div className="p-6">
                  <form onSubmit={handleSaveConfig} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-4">当前启用的网络搜索节点</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`cursor-pointer border-2 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md ${
                          provider === 'serpapi'
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-md shadow-blue-500/10'
                            : 'border-gray-200 hover:border-blue-200 bg-white'
                        }`}>
                          <input type="radio" name="searchProvider" className="sr-only" value="serpapi" checked={provider === 'serpapi'} onChange={(e) => setProvider(e.target.value)} />
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${provider === 'serpapi' ? 'bg-blue-500/20' : 'bg-gray-100'}`}>
                            <Search className={`w-7 h-7 ${provider === 'serpapi' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <span className="font-bold text-xl">SerpAPI</span>
                          <span className="text-xs opacity-60 text-center">Google 搜索代理核心</span>
                        </label>
                        <label className={`cursor-pointer border-2 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md ${
                          provider === 'tavily'
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-md shadow-blue-500/10'
                            : 'border-gray-200 hover:border-blue-200 bg-white'
                        }`}>
                          <input type="radio" name="searchProvider" className="sr-only" value="tavily" checked={provider === 'tavily'} onChange={(e) => setProvider(e.target.value)} />
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${provider === 'tavily' ? 'bg-blue-500/20' : 'bg-gray-100'}`}>
                            <Globe className={`w-7 h-7 ${provider === 'tavily' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <span className="font-bold text-xl">Tavily</span>
                          <span className="text-xs opacity-60 text-center">AI 专用的高级搜索引擎</span>
                        </label>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                      <button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-2.5 px-6 rounded-xl cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> 保存配置并生效
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {activeTab === 'rag' && (
              <>
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-800">本地知识库文件管理</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-gradient-to-b from-gray-50 to-white hover:from-blue-50/50 hover:to-indigo-50/30 hover:border-blue-400 transition-all">
                    {isUploading ? (
                      <div className="flex flex-col items-center text-blue-600">
                        <Loader2 className="w-10 h-10 animate-spin mb-3" />
                        <span className="font-medium">正在上传并保存至服务器...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                          <UploadCloud className="w-7 h-7 text-blue-500" />
                        </div>
                        <h4 className="text-gray-800 font-semibold mb-1">将文档上传到知识库</h4>
                        <p className="text-xs text-gray-400 mb-4">支持 PDF, TXT, MD, DOCX, XLSX, PPTX, CSV 等格式</p>
                        <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-2.5 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0">
                          选择文件并上传
                          <input type="file" accept=".pdf,.txt,.md,.docx,.xlsx,.xls,.pptx,.csv,.py,.js,.html,.css" className="hidden" onChange={handleFileUpload} />
                        </label>
                      </>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4 text-gray-400" />
                      已上传的文档 ({kbFiles.length})
                    </h4>
                    {kbFiles.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm border border-gray-100 rounded-xl bg-gray-50/50">
                        当前知识库为空，暂无文档。
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {kbFiles.map((filename, idx) => (
                          <li key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              </div>
                              <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{filename}</span>
                            </div>
                            <button onClick={() => handleDeleteFile(filename)} className="p-2 cursor-pointer text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'users' && (
              <>
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-800">账号与权限管理</h3>
                  </div>
                  <button onClick={fetchUsers} className="text-sm cursor-pointer font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" /> 刷新列表
                  </button>
                </div>
                <div className="p-6">
                  {isLoadingUsers ? (
                    <div className="flex justify-center items-center py-12 text-blue-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200/60 rounded-2xl shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50">
                          <tr className="border-b border-gray-200 text-sm text-gray-500">
                            <th className="px-6 py-3.5 font-semibold">账号ID</th>
                            <th className="px-6 py-3.5 font-semibold">用户名</th>
                            <th className="px-6 py-3.5 font-semibold">角色权限</th>
                            <th className="px-6 py-3.5 font-semibold text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {users.length > 0 ? users.map((user, idx) => (
                            <tr key={user.id} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-blue-50/50`}>
                              <td className="px-6 py-4 text-sm text-gray-400 font-mono">#{user.id}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-gray-500" />
                                  </div>
                                  {user.username}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <select
                                  value={user.role}
                                  onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                                  disabled={currentUser?.username === user.username}
                                  className="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 disabled:bg-gray-100 text-sm"
                                >
                                  <option value="user">普通用户</option>
                                  <option value="admin">管理员</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  disabled={currentUser?.username === user.username}
                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 disabled:text-gray-300 disabled:cursor-not-allowed p-2 rounded-lg transition-colors inline-flex"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="4" className="text-center py-8 text-gray-400">暂无数据</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}