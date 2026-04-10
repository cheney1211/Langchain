from . import *


auth_bp = Blueprint('auth', __name__)

# ==========================================
# 模拟数据库
# ==========================================
db = {
    "users": [
        {"username": "admin", "password": "123", "role": "admin"},
        {"username": "user", "password": "123", "role": "user"}
    ],
    "api_config": {
        "provider": os.environ.get("SEARCH_PROVIDER", "serpapi").lower()
    }
}

# ==========================================
# 路由：用户鉴权 (登录/注册)
# ==========================================
@auth_bp.route('/login', methods=['POST'])
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

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if any(u['username'] == data.get('username') for u in db['users']):
        return jsonify({"status": "error", "message": "用户名已存在"}), 409
    db['users'].append({"username": data.get('username'), "password": data.get('password'), "role": data.get('role', 'user')})
    return jsonify({"status": "success", "message": "注册成功"})




