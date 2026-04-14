from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
import os
from utils.db import init_db
from utils.rag_helper import get_embeddings
from flask_jwt_extended import JWTManager
from datetime import timedelta

# 加载环境变量
load_dotenv()

def create_app():
    from api import api_bp
    from config import KNOWLEDGE_BASE_DIR
    app = Flask(__name__)
    CORS(app) # 允许跨域请求
    app.json.ensure_ascii = False # 确保 JSON 响应中的中文正常显示


    # ===== JWT 配置 =====
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback-secret-key-please-change-in-env")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15) # Access Token 有效期短 (15分钟)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)    # Refresh Token 有效期长 (7天)
    jwt = JWTManager(app)
    # ====================


    os.makedirs(KNOWLEDGE_BASE_DIR, exist_ok=True) # 确保知识库目录存在

    # 初始化 MySQL 数据库及数据表
    try:
        init_db()
        print("✅ MySQL 数据库连接并初始化成功")
    except Exception as e:
        print(f"⚠️ MySQL 数据库初始化失败，请检查 .env 中的数据库配置: {e}")

    app.register_blueprint(api_bp) # 注册 API 蓝图
    return app

app=create_app()

# if __name__ == '__main__':
#     print("⏳ 正在预热并加载 Embedding 模型到 GPU...")
#     # 判断：我是不是 Flask 「真正的主进程」
#     if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        
#         # 只有主进程，才会打印这句话 + 加载模型
#         try:
#             get_embeddings()  # 加载模型（只执行1次！）
#             print("✅ 模型预加载成功！")
#         except Exception as e:
#             print(f"❌ 模型预加载失败: {e}")
#     print("🚀 Flask API 服务已启动！正在监听端口 5000...")
#     app.run(host='0.0.0.0', port=5000, debug=True)

if __name__ == '__main__':
    # 1. 启动时直接在主进程加载模型
    from utils.rag_helper import get_embeddings
    print("⏳ 正在预热并加载 Embedding 模型到 GPU...")
    try:
        get_embeddings() 
        print("✅ 模型预加载成功！")
    except Exception as e:
        print(f"❌ 模型预加载失败: {e}")
        
    print("🚀 启动 Flask 服务...")
    # 2. 这里的 use_reloader=False 是解决闪退的核心！
    # debug=True 可以保留报错页面，但必须关掉 reloader
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)