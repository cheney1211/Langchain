import os
from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_community.utilities import SerpAPIWrapper
from langchain_tavily import TavilySearch
from utils.rag_helper import get_retriever

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