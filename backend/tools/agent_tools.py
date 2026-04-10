import os
from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_community.utilities import SerpAPIWrapper
from langchain_tavily import TavilySearch


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
    # Langchain 已经内置了 Tavily 的原生支持，max_results 可以控制返回几条数据
    search = TavilySearch(max_results=3)
    return search.invoke({"query": query})

# ==========================================
# 核心逻辑：动态选择工具
# ==========================================
def get_search_tool():
    """根据环境变量，返回对应的搜索引擎工具"""
    # 获取环境变量，如果没有配，默认使用 serpapi
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
    # 无论底层怎么切，大模型拿到的始终是这俩个工具：查本地天气、查通用信息
    return [get_search_tool()]