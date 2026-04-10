from . import * #只有包内导入才用相对路径，其他情况都用绝对路径
from config import KNOWLEDGE_BASE_DIR # 从根目录导入
from utils.validation import allowed_file 
 
rag_bp = Blueprint('rag', __name__)
# ==========================================
# 路由：RAG 知识库管理
# ==========================================
@rag_bp.route('/rag/files', methods=['GET'])
def get_kb_files():
    try:
        files = []
        if os.path.exists(KNOWLEDGE_BASE_DIR):
            # 修改：返回所有在允许列表中的文件，而不仅是 .pdf
            files = [
                f for f in os.listdir(KNOWLEDGE_BASE_DIR) 
                if os.path.isfile(os.path.join(KNOWLEDGE_BASE_DIR, f)) and allowed_file(f)
            ]
        return jsonify({"status": "success", "files": files})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@rag_bp.route('/rag/upload', methods=['POST'])
def upload_kb_file():
    try:
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "没有文件部分"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"status": "error", "message": "未选择文件"}), 400
            
        # 修改：使用 allowed_file 校验后缀
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(KNOWLEDGE_BASE_DIR, filename))
            return jsonify({"status": "success", "message": "知识库文件上传成功"})
        else:
            return jsonify({"status": "error", "message": "不支持的文件格式"}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@rag_bp.route('/rag/files/<filename>', methods=['DELETE'])
def delete_kb_file(filename):
    try:
        file_path = os.path.join(KNOWLEDGE_BASE_DIR, secure_filename(filename))
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({"status": "success", "message": "文件删除成功"})
        else:
            return jsonify({"status": "error", "message": "文件不存在"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
