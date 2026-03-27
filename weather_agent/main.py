from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from tools.agent_tools import get_agent_tools
from langchain_core.prompts import PromptTemplate
import os

# 修改 1: 让函数接收 user_input 作为参数
def run_weather_agent(user_input):
    tools = get_agent_tools()

    llm = ChatOpenAI(
        temperature=0,
        model="qwen3.5-plus",   # 有效模型名
        openai_api_key=os.getenv("DASHSCOPE_API_KEY"),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"  # 关键修复
    )

    agent = create_agent(model=llm, tools=tools, system_prompt="你是一个智能助手，可以查询天气、搜索信息并提供建议。")
    
    # 修改 2: 直接使用传入的 user_input 变量，不再写死
    result = agent.invoke({"messages": [{"role": "user", "content": user_input}]})

    return result['messages'][-1].content

if __name__ == "__main__":
    print("🤖 智能助手已启动！(输入 '退出' 或 'exit' 结束对话)")
    
    # 修改 3: 使用 while 循环，实现持续对话
    while True:
        # 修改 4: 使用 input() 接收用户在控制台的输入
        current_input = input("\n👤 请输入你的问题: ")
        
        # 清理输入的空格，如果用户直接按了回车没有输入内容，则跳过本次循环
        if not current_input.strip():
            continue
            
        # 检查用户是否想要退出程序
        if current_input.lower() in ['退出', 'exit', 'quit']:
            print("👋 再见！期待下次为你服务。")
            break
            
        print("⏳ 助手正在调用工具思考中，请稍候...")
        
        # 修改 5: 将用户实际输入的内容传递给函数
        final_result = run_weather_agent(current_input)
        
        print("-" * 40)
        print(f"✅ 助手的回答：\n{final_result}")
        print("-" * 40)