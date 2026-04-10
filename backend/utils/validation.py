import os
from config import ALLOWED_EXTENSIONS #从根目录导入
def allowed_file(filename):
    """检查文件后缀是否在允许列表中"""
    return '.' in filename and \
           os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS