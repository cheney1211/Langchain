from . import *
from .auth import db # 引入模拟数据库

admin_bp = Blueprint('admin', __name__)
# ==========================================
# 路由：管理员配置
# ==========================================
@admin_bp.route('/admin_config', methods=['GET', 'POST'])
def manage_config():
    if request.method == 'POST':
        new_config = request.json
        db['api_config']['provider'] = new_config.get('provider', 'serpapi')
        os.environ["SEARCH_PROVIDER"] = db['api_config']['provider']
        return jsonify({"status": "success", "message": f"引擎已切换为 {os.environ['SEARCH_PROVIDER']}"})
    return jsonify(db['api_config'])