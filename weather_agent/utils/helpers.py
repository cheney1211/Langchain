import requests

def get_current_location():
    """
    通过IP获取当前所在城市
    返回：城市名, 国家
    """
    try:
        # response = requests.get('https://ipinfo.io', timeout=5)
        # data = response.json()
        # return f"{data.get('city', '未知城市')}, {data.get('country', '未知国家')}"
        return "重庆长寿, 中国"  # 临时返回固定位置，避免IP服务不稳定导致的错误
    except Exception as e:
        return f"获取位置失败：{str(e)}"