from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection
import uuid

history_bp = Blueprint('history', __name__)

# 获取当前用户的所有会话列表
@history_bp.route('/history/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    username = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 先查 user_id
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            
            cursor.execute("SELECT * FROM chat_sessions WHERE user_id = %s ORDER BY created_at DESC", (user['id'],))
            sessions = cursor.fetchall()
        return jsonify({"status": "success", "sessions": sessions})
    finally:
        conn.close()

# 获取某个会话的历史消息
@history_bp.route('/history/sessions/<session_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(session_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT role, content FROM chat_messages WHERE session_id = %s ORDER BY created_at ASC", (session_id,))
            messages = cursor.fetchall()
        return jsonify({"status": "success", "messages": messages})
    finally:
        conn.close()

# 删除某个指定的会话
@history_bp.route('/history/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    username = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. 查找当前操作的用户 ID
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            if not user:
                return jsonify({"status": "error", "message": "用户不存在"}), 404

            # 2. 执行删除操作，附加 user_id=%s 的条件，确保只能删除属于自己的对话
            cursor.execute(
                "DELETE FROM chat_sessions WHERE id = %s AND user_id = %s", 
                (session_id, user['id'])
            )
            
            # rowcount 为 0 表示没有删除任何数据（可能是 session_id 不存在，或者不是该用户的）
            if cursor.rowcount == 0:
                return jsonify({"status": "error", "message": "会话不存在或无权限删除"}), 403

            conn.commit()
            
        return jsonify({"status": "success", "message": "会话删除成功"})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()