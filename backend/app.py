from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
import os
# 加载环境变量
load_dotenv()


def create_app():
    from api import api_bp
    from config import KNOWLEDGE_BASE_DIR
    app = Flask(__name__)
    CORS(app) # 允许跨域请求
    app.json.ensure_ascii = False # 确保 JSON 响应中的中文正常显示

    os.makedirs(KNOWLEDGE_BASE_DIR, exist_ok=True) # 确保知识库目录存在

    app.register_blueprint(api_bp) # 注册 API 蓝图
    return app

app=create_app()




if __name__ == '__main__':
    print("🚀 Flask API 服务已启动！正在监听端口 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)