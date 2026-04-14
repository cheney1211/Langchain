import axios from 'axios';

// 创建 axios 实例，统一配置基础 URL 和超时
const api = axios.create({
  baseURL: 'http://127.0.0.1:5000/api',
  timeout: 30000, 
});

// ==========================================
// 1. 请求拦截器 (Request Interceptor)
// 作用：在每个请求发出去前，自动带上 access_token
// ==========================================
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    // Axios 会自动根据请求数据类型（如 JSON 或 FormData）设置对应的 Content-Type
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// 2. 响应拦截器 (Response Interceptor)
// 作用：统一处理 401 错误，实现无感刷新 Token
// ==========================================
api.interceptors.response.use(
  (response) => response, // 请求成功，直接返回响应
  async (error) => {
    const originalRequest = error.config;

    // 判断是否是 401 未授权错误，且该请求还没有重试过（防止无限循环）
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; 
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // 注意：为了避免拦截器死循环，这里使用全局原生的 axios 去请求刷新接口
          const refreshResponse = await axios.post('http://127.0.0.1:5000/api/refresh', {}, {
            headers: { 'Authorization': `Bearer ${refreshToken}` }
          });

          if (refreshResponse.status === 200) {
            const newAccessToken = refreshResponse.data.access_token;
            
            // 刷新成功，保存新的 token
            localStorage.setItem('access_token', newAccessToken);

            // 替换掉之前失败请求的 Authorization header，然后重新发起请求
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return api(originalRequest); 
          }
        } catch (refreshError) {
          // 如果 refresh_token 也过期或无效，强制登出
          logoutAndRedirect();
          return Promise.reject(refreshError);
        }
      } else {
        // 根本没有 refresh_token，直接强制登出
        logoutAndRedirect();
      }
    }

    return Promise.reject(error);
  }
);

// 工具：清除状态并回退到登录
function logoutAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.reload(); 
}

export default api;