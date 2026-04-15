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
