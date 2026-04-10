from . import *

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_input = data.get('prompt') or data.get('message')
        
        if not user_input:
            return jsonify({"status": "error", "message": "缺少输入内容"}), 400
            
        print(f"📥 收到 API 请求，用户问题: {user_input}")
        def run_weather_agent(user_input):
            tools = get_agent_tools()

            llm = ChatOpenAI(
                temperature=0,
                model="qwen3.5-plus",   # 有效模型名
                openai_api_key=os.getenv("DASHSCOPE_API_KEY"),
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"  
            )

            agent = create_agent(model=llm, tools=tools, system_prompt="你是一个智能助手，可以查询天气、从网络搜索信息、以及从本地知识库中检索相关内容来回答用户的问题。请根据用户的提问，合理调用工具获取信息，并给出准确的回答。")
            
            # 修改 2: 直接使用传入的 user_input 变量，不再写死
            result = agent.invoke({"messages": [{"role": "user", "content": user_input}]})

            return result['messages'][-1].content

        
        agent_response = run_weather_agent(user_input)


        
        return jsonify({
            "status": "success",
            "reply": agent_response
        }), 200
        
    except Exception as e:
        print(f"❌ 发生错误: {str(e)}")
        return jsonify({"status": "error", "message": f"内部错误: {str(e)}"}), 500