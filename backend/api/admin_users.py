from . import *
from utils.db import get_db_connection

admin_users_bp = Blueprint('admin_users', __name__)

# ==========================================
# 路由：管理员 - 获取用户列表
# ==========================================
@admin_users_bp.route('/admin/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 排除密码返回给前端
            cursor.execute("SELECT id, username, role FROM users")
            users = cursor.fetchall()
        return jsonify({"status": "success", "users": users})
    except Exception as e:
        return jsonify({"status": "error", "message": f"数据库错误: {str(e)}"}), 500
    finally:
        conn.close()

# ==========================================
# 路由：管理员 - 更新用户角色
# ==========================================
@admin_users_bp.route('/admin/users/<int:user_id>/role', methods=['PUT'])
def update_user_role(user_id):
    data = request.json
    new_role = data.get('role')
    
    if not new_role or new_role not in ['user', 'admin']:
        return jsonify({"status": "error", "message": "无效的角色"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET role = %s WHERE id = %s", (new_role, user_id))
            conn.commit()
        return jsonify({"status": "success", "message": "用户角色更新成功"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"数据库错误: {str(e)}"}), 500
    finally:
        conn.close()

# ==========================================
# 路由：管理员 - 删除用户
# ==========================================
@admin_users_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            conn.commit()
        return jsonify({"status": "success", "message": "用户删除成功"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"数据库错误: {str(e)}"}), 500
    finally:
        conn.close()