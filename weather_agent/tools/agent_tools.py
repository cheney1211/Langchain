from langchain_community.utilities import SerpAPIWrapper
from langchain_core.tools import tool
from utils.helpers import get_current_location
from dotenv import load_dotenv
import os

# 初始化 SerpAPI 包装器（可以放在函数外，避免重复初始化）
load_dotenv()
search = SerpAPIWrapper(serpapi_api_key=os.getenv("SERPAPI_API_KEY"))

@tool
def search_engine(query: str) -> str:
    """用于查询实时天气、新闻、未知信息。"""
    return search.run(query)

@tool
def get_current_location_tool() -> str:
    """获取用户当前所在城市，无需输入参数。"""
    return get_current_location()

def get_agent_tools():
    return [search_engine, get_current_location_tool]