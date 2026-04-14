import React, { useState, useEffect } from 'react';
import { Shield, Search, Globe, Settings, CheckCircle2, Bot, User, UploadCloud, FileText, Trash2, Loader2, Users } from 'lucide-react';
import api from '../utils/authFetch'; // 引入 axios 实例

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

  return (
   <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          管理员控制台
        </h2>
        <p className="text-gray-500 mt-2">管理系统级配置、大模型联网工具选项、本地知识库以及账号管理。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('search')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors cursor-pointer ${activeTab === 'search' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Search className="w-5 h-5" /> 搜索工具配置
          </button>
          <button 
            onClick={() => setActiveTab('rag')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors cursor-pointer ${activeTab === 'rag' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Bot className="w-5 h-5" /> 知识库 (RAG)
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors cursor-pointer ${activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Users className="w-5 h-5" /> 用户管理
          </button>
        </div>

        <div className="col-span-1 lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
            {saveStatus && (
              <div className="m-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2 border border-green-100">
                <CheckCircle2 className="w-5 h-5" />
                {saveStatus}
              </div>
            )}

            {activeTab === 'search' && (
              <>
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-gray-500" />
                    大模型 Agent 搜索引擎切换
                  </h3>
                </div>
                <div className="p-6">
                  <form onSubmit={handleSaveConfig} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">当前启用的网络搜索节点</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${provider === 'serpapi' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="searchProvider" className="sr-only" value="serpapi" checked={provider === 'serpapi'} onChange={(e) => setProvider(e.target.value)} />
                          <span className="font-bold text-lg">SerpAPI</span>
                          <span className="text-xs opacity-70">Google 搜索代理核心</span>
                        </label>
                        <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${provider === 'tavily' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="searchProvider" className="sr-only" value="tavily" checked={provider === 'tavily'} onChange={(e) => setProvider(e.target.value)} />
                          <span className="font-bold text-lg">Tavily</span>
                          <span className="text-xs opacity-70">AI 专用的高级搜索引擎</span>
                        </label>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                        <Settings className="w-4 h-4" /> 保存配置并生效
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {activeTab === 'rag' && (
              <>
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-500" />
                    本地知识库文件管理
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    {isUploading ? (
                      <div className="flex flex-col items-center text-blue-600">
                        <Loader2 className="w-10 h-10 animate-spin mb-3" />
                        <span className="font-medium">正在上传并保存至服务器...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                        <h4 className="text-gray-800 font-medium mb-1">将文档上传到知识库</h4>
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg transition-colors mt-2">
                          选择文件并上传
                          <input type="file" accept=".pdf,.txt,.md,.docx,.xlsx,.xls,.pptx,.csv,.py,.js,.html,.css" className="hidden" onChange={handleFileUpload} />
                        </label>
                      </>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex justify-between items-center">
                      <span>已上传的文档 ({kbFiles.length})</span>
                    </h4>
                    {kbFiles.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm border border-gray-100 rounded-xl bg-gray-50">
                        当前知识库为空，暂无文档。
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {kbFiles.map((filename, idx) => (
                          <li key={idx} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-white hover:border-blue-300 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-700 truncate">{filename}</span>
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
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    账号与权限管理
                  </h3>
                  <button onClick={fetchUsers} className="text-sm cursor-pointer font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors">
                    刷新列表
                  </button>
                </div>
                <div className="p-6">
                  {isLoadingUsers ? (
                    <div className="flex justify-center items-center py-12 text-blue-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                          <tr className="border-b border-gray-200 text-sm text-gray-500">
                            <th className="px-6 py-3 font-medium">账号ID</th>
                            <th className="px-6 py-3 font-medium">用户名</th>
                            <th className="px-6 py-3 font-medium">角色权限</th>
                            <th className="px-6 py-3 font-medium text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {users.length > 0 ? users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-500">#{user.id}</td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.username}</td>
                              <td className="px-6 py-4 text-sm">
                                <select 
                                  value={user.role} 
                                  onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                                  disabled={currentUser?.username === user.username}
                                  className="bg-white border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 disabled:bg-gray-100"
                                >
                                  <option value="user">普通用户 (User)</option>
                                  <option value="admin">管理员 (Admin)</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  disabled={currentUser?.username === user.username}
                                  className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed p-2 rounded-lg hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="5" className="text-center py-8 text-gray-500">暂无数据</td></tr>
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