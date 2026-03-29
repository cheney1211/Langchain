import requests


def get_current_location() -> str:
    """
    通过 IP 地址获取当前所在城市
    """
    try:
        # ipinfo.io 提供免费的基础 IP 定位服务
        response = requests.get('https://ipinfo.io/json', timeout=5)
        response.raise_for_status() # 检查请求是否成功
        data = response.json()
        
        # 提取城市信息
        city = data.get('city', '未知城市')
        region = data.get('region', '')
        country = data.get('country', '')
        
        # 组合成易于大模型理解的字符串
        location_str = f"{country} {region} {city}"
        return location_str.strip()
        
    except Exception as e:
         return f"获取位置失败：{str(e)}"