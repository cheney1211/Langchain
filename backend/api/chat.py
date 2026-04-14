from . import *
from tools.agent_tools import get_agent_tools, knowledge_base_search
from flask_jwt_extended import jwt_required

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat', methods=['POST'])
@jwt_required() # 保护接口
def chat():
    try:
        data = request.get_json()
        user_input = data.get('prompt') or data.get('message')
        use_rag = data.get('use_rag', False)
        
        if not user_input:
            return jsonify({"status": "error", "message": "缺少输入内容"}), 400
            
        print(f"📥 收到 API 请求，用户问题: {user_input} | 是否使用 RAG: {use_rag}")
        
        def run_agent(user_input, use_rag):
            if use_rag:
                tools = [knowledge_base_search]
                system_prompt = "你是一个本地知识库问答助手，你无法访问互联网，只能通过本地知识检索工具获取信息并回答用户问题。如果知识库中没有相关答案，请直接回复不知道，不要编造答案。"
            else:
                tools = get_agent_tools()
                system_prompt = "你是一个智能助手，可以从网络搜索信息来回答用户的问题。请根据用户的提问，合理调用工具获取信息，并给出准确的回答。"

            llm = ChatOpenAI(
                temperature=0,
                model="qwen3.5-plus", 
                openai_api_key=os.getenv("DASHSCOPE_API_KEY"),
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"  
            )

            agent = create_agent(model=llm, tools=tools, system_prompt=system_prompt)
            result = agent.invoke({"messages": [{"role": "user", "content": user_input}]})
            return result['messages'][-1].content

        agent_response = run_agent(user_input, use_rag)
        
        return jsonify({
            "status": "success",
            "reply": agent_response
        }), 200
        
    except Exception as e:
        print(f"❌ 发生错误: {str(e)}")
        return jsonify({"status": "error", "message": f"内部错误: {str(e)}"}), 500