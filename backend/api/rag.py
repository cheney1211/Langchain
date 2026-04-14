from . import * #只有包内导入才用相对路径，其他情况都用绝对路径
from config import KNOWLEDGE_BASE_DIR # 从根目录导入
from utils.validation import allowed_file 
import threading
from utils.rag_helper import build_vectorstore
from flask_jwt_extended import jwt_required
 
rag_bp = Blueprint('rag', __name__)
# ==========================================
# 路由：RAG 知识库管理
# ==========================================
@rag_bp.route('/rag/files', methods=['GET'])
@jwt_required()
def get_kb_files():
    try:
        files = []
        if os.path.exists(KNOWLEDGE_BASE_DIR):
            files = [
                f for f in os.listdir(KNOWLEDGE_BASE_DIR) 
                if os.path.isfile(os.path.join(KNOWLEDGE_BASE_DIR, f)) and allowed_file(f)
            ]
        return jsonify({"status": "success", "files": files})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@rag_bp.route('/rag/upload', methods=['POST'])
@jwt_required()
def upload_kb_file():
    try:
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "没有文件部分"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"status": "error", "message": "未选择文件"}), 400
            
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(KNOWLEDGE_BASE_DIR, filename))
            
            # 使用后台线程自动构建向量库，避免阻塞前端的上传请求响应
            threading.Thread(target=build_vectorstore).start()
            
            return jsonify({"status": "success", "message": "知识库文件上传成功，正在后台构建向量库"})
        else:
            return jsonify({"status": "error", "message": "不支持的文件格式"}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@rag_bp.route('/rag/files/<filename>', methods=['DELETE'])
@jwt_required()
def delete_kb_file(filename):
    try:
        file_path = os.path.join(KNOWLEDGE_BASE_DIR, secure_filename(filename))
        if os.path.exists(file_path):
            os.remove(file_path)
            
            # 删除后同步启动后台线程更新向量库（清空或重建）
            threading.Thread(target=build_vectorstore).start()
            
            return jsonify({"status": "success", "message": "文件删除成功，正在后台同步向量库"})
        else:
            return jsonify({"status": "error", "message": "文件不存在"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500