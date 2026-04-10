import os

KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(__file__), 'knowledge_base')

# 新增：允许上传的知识库文件后缀列表
ALLOWED_EXTENSIONS = {
    '.pdf', '.txt', '.md', '.docx', '.xlsx', '.xls', 
    '.pptx', '.csv', '.py', '.js', '.html', '.css'
}