from flask import Flask, request, jsonify
from main import run_weather_agent
from dotenv import load_dotenv

# 加载环境变量 (包括 API Keys 和 SEARCH_PROVIDER)
load_dotenv()

app = Flask(__name__)

# 配置支持中文显示的 JSON 格式
app.config['JSON_AS_ASCII'] = False

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    接收前端 POST 请求，调用 LangChain Agent，返回结果
    """
    try:
        # 1. 获取前端传来的 JSON 数据
        data = request.get_json()
        
        # 2. 基础参数校验
        if not data or 'message' not in data:
            return jsonify({
                "status": "error", 
                "message": "请求参数错误，缺少 'message' 字段"
            }), 400
            
        user_input = data['message']
        
        # 3. 调用现有的 LangChain Agent 核心逻辑
        print(f"📥 收到 API 请求，用户问题: {user_input}")
        agent_response = run_weather_agent(user_input)
        
        # 4. 返回标准化的 JSON 响应
        return jsonify({
            "status": "success",
            "data": {
                "question": user_input,
                "reply": agent_response
            }
        }), 200
        
    except Exception as e:
        # 异常捕获与处理（简历上写的“完善异常捕获”就体现在这里）
        print(f"❌ 发生错误: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": f"服务器内部错误: {str(e)}"
        }), 500

if __name__ == '__main__':
    # 启动 Flask 服务
    print("🚀 Flask API 服务已启动！正在监听端口 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)