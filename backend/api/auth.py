from . import *
from utils.db import get_db_connection

auth_bp = Blueprint('auth', __name__)

# ==========================================
# 路由：用户鉴权 (登录/注册)
# ==========================================
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    if not username or not password:
        return jsonify({"status": "error", "message": "用户名和密码不能为空"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()

        if not user:
            # 满足需求: 如果不在数据库内，提醒注册
            return jsonify({"status": "error", "message": "该账户尚未注册，请先注册"}), 404
        
        if user['password'] != password:
            return jsonify({"status": "error", "message": "密码错误"}), 401
        
        if user['role'] != role:
            return jsonify({"status": "error", "message": "角色不匹配"}), 403
            
        return jsonify({"status": "success", "user": {"username": user['username'], "role": user['role']}})
    except Exception as e:
         return jsonify({"status": "error", "message": f"数据库错误: {str(e)}"}), 500
    finally:
        conn.close()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')

    if not username or not password:
        return jsonify({"status": "error", "message": "用户名和密码不能为空"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 检查用户名是否已经被注册
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                return jsonify({"status": "error", "message": "用户名已存在"}), 409
            
            # 将新用户写入数据库
            cursor.execute(
                "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                (username, password, role)
            )
            conn.commit()
            
        return jsonify({"status": "success", "message": "注册成功"})
    except Exception as e:
         return jsonify({"status": "error", "message": f"数据库错误: {str(e)}"}), 500
    finally:
        conn.close()