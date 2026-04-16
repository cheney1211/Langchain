import os
from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_community.utilities import SerpAPIWrapper
from langchain_tavily import TavilySearch
from utils.rag_helper import get_retriever
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
load_dotenv()

# ==========================================
# 工具 1：SerpAPI 搜索
# ==========================================
@tool
def serpapi_search(query: str) -> str:
    """用于查询实时天气、新闻、未知信息。"""
    search = SerpAPIWrapper(serpapi_api_key=os.getenv("SERPAPI_API_KEY"))
    return search.run(query)

# ==========================================
# 工具 2：Tavily 搜索
# ==========================================
@tool
def tavily_search(query: str) -> str:
    """用于查询实时天气、新闻、未知信息的高级搜索。"""
    search = TavilySearch(max_results=3)
    return search.invoke({"query": query})

# ==========================================
# 工具 3：RAG 本地知识库搜索
# ==========================================
@tool
def knowledge_base_search(query: str) -> str:
    """用于从本地知识库中检索相关内容，获取事实和文档信息。"""
    retriever = get_retriever()
    if not retriever:
        return "本地知识库为空或尚未构建完成，无法检索。"
    docs = retriever.invoke(query)
    if not docs:
        return "本地知识库中未找到相关内容。"
    return "\n\n".join([doc.page_content for doc in docs])


# ==========================================
# 核心逻辑：动态选择工具
# ==========================================
def get_search_tool():
    """根据环境变量，返回对应的搜索引擎工具"""
    provider = os.getenv("SEARCH_PROVIDER", "serpapi").lower()
    
    if provider == "tavily":
        print("🔍 当前使用的搜索引擎: Tavily")
        return tavily_search
    else:
        print("🔍 当前使用的搜索引擎: SerpAPI")
        return serpapi_search

# ==========================================
# 暴露给 Agent 的最终工具列表
# ==========================================

def get_agent_tools():
    # 联网搜索工具列表
    return [get_search_tool()]

# ==========================================
#  构建并获取 Agent Executor
# ==========================================
def get_agent_executor(use_rag: bool = False):
    """
    初始化并返回新的 LangGraph Agent。
    """
    # 阿里云 DashScope 
    llm = ChatOpenAI(
        temperature=0,
        model="qwen3.5-flash", 
        openai_api_key=os.getenv("DASHSCOPE_API_KEY"),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"  
    )
    
    if use_rag:
        # RAG 模式：暴露本地知识库
        system_prompt = (
            "你是一个专业的 AI 助手。你现在正处于**本地知识库问答模式**。\n"
            "请你优先使用提供的 knowledge_base_search 工具来检索答案。\n"
            "如果你在提供的背景知识中找不到答案，请直接明确回答“根据提供的知识库，我无法回答这个问题”，绝不能凭借自身记忆捏造事实。"
        )
        active_tools = [knowledge_base_search]
    else:
        # 网络模式：暴露搜索引擎
        system_prompt = (
            "你是一个有用的 AI 助手。请尽力回答用户的问题。\n"
            "如果遇到不知道或需要最新信息的问题，你可以使用提供的搜索工具去网络上搜索。"
        )
        active_tools = [get_search_tool()]

    # 在 Langchain v1 中，直接调用 create_agent，无需手动定义 Prompt Template 和 AgentExecutor
    agent = create_agent(
        model=llm,
        tools=active_tools,
        system_prompt=system_prompt
    )
    
    return agent