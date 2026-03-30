import requests

url = "http://127.0.0.1:5000/api/chat"
# Python 字典格式，自动处理所有中文和引号转义
data = {"message": "今天杭州的天气怎么样？"}

print("⏳ 正在发送请求...")
response = requests.post(url, json=data)

print("状态码:", response.status_code)
# 强制打印出正确编码的中文结果
print("返回结果:", response.json()['data']['reply'])