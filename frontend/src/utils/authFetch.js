/**
 * 封装原生 fetch，自动添加 JWT 鉴权并在 401 失败时尝试无感刷新令牌。
 */
export const authFetch = async (url, options = {}) => {
  let accessToken = localStorage.getItem('access_token');
  const headers = new Headers(options.headers || {});

  // 1. 如果有 accessToken，自动带上 Authorization 头
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // 2. 自动补充 JSON Content-Type（但排除 FormData 等情况）
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // 3. 发起请求
  let response = await fetch(url, { ...options, headers });

  // 4. 如果 Access Token 过期 (HTTP 401)
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        // 请求刷新 token 接口
        const refreshResponse = await fetch('http://127.0.0.1:5000/api/refresh', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${refreshToken}` }
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          // 更新本地存储的 access_token
          accessToken = data.access_token;
          localStorage.setItem('access_token', accessToken);

          // 替换掉之前过期的 token 并重新发起由于 401 失败的那次请求
          headers.set('Authorization', `Bearer ${accessToken}`);
          response = await fetch(url, { ...options, headers });
        } else {
          // Refresh Token 也过期或者无效，强制登出
          logoutAndRedirect();
        }
      } catch (error) {
        logoutAndRedirect();
      }
    } else {
      // 根本没有 refresh token，强制登出
      logoutAndRedirect();
    }
  }

  return response;
};

// 工具：清除状态并回退到登录
function logoutAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.reload(); 
}