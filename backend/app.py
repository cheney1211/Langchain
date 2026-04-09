from flask import Flask, request, jsonify
from flask_cors import CORS
from main import run_weather_agent
from dotenv import load_dotenv
import os

# 加载环境变量
load_dotenv()

app = Flask(__name__)
# 允许跨域请求，这是 Vite 前端(默认端口5173)访问后端(端口5000)所必需的
CORS(app) 
app.config['JSON_AS_ASCII'] = False

# ==========================================
# 模拟数据库：存储用户和系统配置
# ==========================================
db = {
    "users": [
        {"username": "admin", "password": "123", "role": "admin"},
        {"username": "user", "password": "123", "role": "user"}
    ],
    "api_config": {
        # 直接读取您现有 agent_tools.py 依赖的环境变量
        "provider": os.environ.get("SEARCH_PROVIDER", "serpapi").lower()
    }
}

# ==========================================
# 路由：用户鉴权 (登录/注册)
# ==========================================
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = next((u for u in db['users'] if u['username'] == data.get('username')), None)
    if not user:
        return jsonify({"status": "error", "message": "该账户未注册"}), 404
    if user['password'] != data.get('password'):
        return jsonify({"status": "error", "message": "密码错误"}), 401
    if user['role'] != data.get('role'):
        return jsonify({"status": "error", "message": "角色不匹配"}), 403
    return jsonify({"status": "success", "user": {"username": user['username'], "role": user['role']}})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if any(u['username'] == data.get('username') for u in db['users']):
        return jsonify({"status": "error", "message": "用户名已存在"}), 409
    db['users'].append({"username": data.get('username'), "password": data.get('password'), "role": data.get('role', 'user')})
    return jsonify({"status": "success", "message": "注册成功"})

# ==========================================
# 路由：大模型对话接口 (对接您的 Agent)
# ==========================================
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        # 兼容前端发送的 prompt 或 message 字段
        user_input = data.get('prompt') or data.get('message')
        
        if not user_input:
            return jsonify({"status": "error", "message": "缺少输入内容"}), 400
            
        print(f"📥 收到 API 请求，用户问题: {user_input}")
        # 调用您现有的 LangChain Agent
        agent_response = run_weather_agent(user_input)
        
        # 返回格式适配前端 UI
        return jsonify({
            "status": "success",
            "reply": agent_response # 前端直接读取 data.reply
        }), 200
        
    except Exception as e:
        print(f"❌ 发生错误: {str(e)}")
        return jsonify({"status": "error", "message": f"内部错误: {str(e)}"}), 500

# ==========================================
# 路由：管理员配置 (动态切换搜索工具)
# ==========================================
@app.route('/api/config', methods=['GET', 'POST'])
def manage_config():
    if request.method == 'POST':
        new_config = request.json
        db['api_config']['provider'] = new_config.get('provider', 'serpapi')
        # 动态更新环境变量，这样您的 get_search_tool() 下次被调用时就会读取到新值
        os.environ["SEARCH_PROVIDER"] = db['api_config']['provider']
        return jsonify({"status": "success", "message": f"引擎已切换为 {os.environ['SEARCH_PROVIDER']}"})
    return jsonify(db['api_config'])

if __name__ == '__main__':
    print("🚀 Flask API 服务已启动！正在监听端口 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)