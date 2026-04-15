from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid

# 引入你的数据库工具
from utils.db import get_db_connection

# 引入 Agent 工具
from tools.agent_tools import get_agent_executor

# 引入 LangChain 消息类型
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

chat_bp = Blueprint('chat', __name__)

# def run_agent(messages_history, use_rag):
#     """
#     接收消息数组并调用 AgentExecutor
#     :param messages_history: list of dict [{"role": "user", "content": "..."}, ...]
#     :param use_rag: boolean 是否使用知识库
#     """
#     # 1. 初始化 agent executor (传入 use_rag 才能动态切换网络搜索工具或本地知识库工具)
#     agent_executor = get_agent_executor(use_rag)
    
#     # 2. 提取当前问题 (最后一条 user 消息)
#     current_query = messages_history[-1]['content'] if messages_history else ""

#     # (已移除 query_rag 手动拦截拼接逻辑。当 use_rag=True 时，
#     # agent_tools 中的大模型会利用赋予的 knowledge_base_search 工具自行检索背景知识)

#     # 3. 构建 LangChain 格式的 message 列表
#     langchain_messages = []
#     # 遍历除了最后一条以外的所有历史记录
#     for msg in messages_history[:-1]:
#         if msg['role'] == 'user':
#             langchain_messages.append(HumanMessage(content=msg['content']))
#         elif msg['role'] == 'model':
#             langchain_messages.append(AIMessage(content=msg['content']))
            
#     # 将当前最新的问题加入末尾
#     langchain_messages.append(HumanMessage(content=current_query))

#     # 4. 调用新版 agent
#     try:
#         # 新版 invoke 参数为 {"messages": [...]}
#         response = agent_executor.invoke({
#             "messages": langchain_messages
#         })
        
#         # 新版 agent 返回结果也会被包裹在 messages 列表的最后一条中
#         final_message = response["messages"][-1]
#         return final_message.content
        
#     except Exception as e:
#         print(f"Agent execution error: {e}")
#         return f"执行出错: {str(e)}"

def run_agent(messages_history, use_rag):
    try:
        # 把初始化也放进 try 里，防止 create_agent 报错引发 500
        agent_executor = get_agent_executor(use_rag)
        
        current_query = messages_history[-1]['content'] if messages_history else ""

        langchain_messages = []
        for msg in messages_history[:-1]:
            if msg['role'] == 'user':
                langchain_messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'model':
                langchain_messages.append(AIMessage(content=msg['content']))

        langchain_messages.append(HumanMessage(content=current_query))

        response = agent_executor.invoke({"messages": langchain_messages})
        return response["messages"][-1].content
        
    except Exception as e:
        print(f"Agent execution error: {e}")
        # 这样即便模型或者工具报错，也会把具体原因返回给前端气泡
        return f"AI执行出错，详情: {str(e)}"

@chat_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    """
    处理对话请求
    预期 JSON 格式: {"prompt": "你好", "use_rag": true, "session_id": "xxx-xxx-xxx"}
    """
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({"status": "error", "message": "缺少 prompt 参数"}), 400

    user_input = data['prompt']
    use_rag = data.get('use_rag', False)
    session_id = data.get('session_id')
    
    username = get_jwt_identity()
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cursor:
            # 获取用户 ID
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            user_row = cursor.fetchone()
            if not user_row:
                return jsonify({"status": "error", "message": "用户不存在"}), 404
            user_id = user_row['id']

            # 安全校验：如果传入了 session_id，检查是否属于当前用户
            if session_id:
                cursor.execute("SELECT id FROM chat_sessions WHERE id = %s AND user_id = %s", (session_id, user_id))
                if not cursor.fetchone():
                    return jsonify({"status": "error", "message": "会话不存在或无权限访问"}), 403
            else:
                # 如果没有 session_id，创建一个新的会话
                session_id = str(uuid.uuid4())
                # 截取开头的几个字作为会话标题
                title = user_input[:20] + "..." if len(user_input) > 20 else user_input
                cursor.execute(
                    "INSERT INTO chat_sessions (id, user_id, title) VALUES (%s, %s, %s)", 
                    (session_id, user_id, title)
                )
            
            # 1. 保存当前用户的提问到数据库
            cursor.execute(
                "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)", 
                (session_id, 'user', user_input)
            )
            conn.commit()
            
            # 2. 查询该会话的历史消息给 LangChain (限制最近 10 条，避免 token 超出)
            # 使用子查询来获取最新的 10 条，然后再按时间正序排列
            cursor.execute("""
                SELECT role, content 
                FROM (
                    SELECT id, role, content, created_at 
                    FROM chat_messages 
                    WHERE session_id = %s 
                    ORDER BY created_at DESC 
                    LIMIT 10
                ) AS sub 
                ORDER BY created_at ASC
            """, (session_id,))
            history_rows = cursor.fetchall()
            
            # 组装消息列表
            messages_history = [{"role": row['role'], "content": row['content']} for row in history_rows]

        # 3. 运行 Agent 生成回复
        agent_response = run_agent(messages_history, use_rag)
        
        # 4. 将 AI 的回答保存回数据库
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)", 
                (session_id, 'model', agent_response)
            )
            conn.commit()
            
        return jsonify({
            "status": "success",
            "reply": agent_response,
            "session_id": session_id # 返回 session_id 给前端，如果是新对话，前端会用到
        })
        
    except Exception as e:
        if conn:
            conn.rollback() # 发生错误时回滚事务
        print(f"Chat API Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()