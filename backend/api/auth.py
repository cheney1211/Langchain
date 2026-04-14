from . import *
from utils.db import get_db_connection
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity

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
            return jsonify({"status": "error", "message": "该账户尚未注册，请先注册"}), 404
        
        if user['password'] != password:
            return jsonify({"status": "error", "message": "密码错误"}), 401
        
        if user['role'] != role:
            return jsonify({"status": "error", "message": "角色不匹配"}), 403
            
        # 登录成功，生成双令牌
        access_token = create_access_token(identity=user['username'], additional_claims={"role": user['role']})
        refresh_token = create_refresh_token(identity=user['username'])

        return jsonify({
            "status": "success", 
            "user": {"username": user['username'], "role": user['role']},
            "access_token": access_token,
            "refresh_token": refresh_token
        })
    except Exception as e:
         return jsonify({"status": "error", "message": f"数据库错误: {str(e)}"}), 500
    finally:
        conn.close()

# ==========================================
# 路由：刷新 Access Token
# ==========================================
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE username = %s", (current_user,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({"status": "error", "message": "用户不存在"}), 404
                
            # 签发新的 access_token
            new_access_token = create_access_token(identity=current_user, additional_claims={"role": user['role']})
            return jsonify({"status": "success", "access_token": new_access_token})
    finally:
        conn.close()

# ==========================================
# 路由：获取当前用户信息 (用于前端初始化验证)
# ==========================================
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT username, role FROM users WHERE username = %s", (current_user,))
            user = cursor.fetchone()
            if not user:
                return jsonify({"status": "error", "message": "用户不存在"}), 404
            return jsonify({"status": "success", "user": {"username": user['username'], "role": user['role']}})
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
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                return jsonify({"status": "error", "message": "用户名已存在"}), 409
            
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