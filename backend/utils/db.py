import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """获取数据库连接"""
    return pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'), # 默认密码为空或根据你本地的 MySQL 设置
        database=os.getenv('DB_NAME'),
        port=int(os.getenv('DB_PORT')),
        cursorclass=pymysql.cursors.DictCursor
    )

def init_db():
    """初始化数据库及相关表"""
    # 1. 连接 MySQL 创建数据库 (如果不存在)
    conn = pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=int(os.getenv('DB_PORT'))
    )
    db_name = os.getenv('DB_NAME', 'langchain_db')
    with conn.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    conn.close()

    # 2. 连接到具体的数据库，创建用户表
    conn = get_db_connection()
    with conn.cursor() as cursor:
        # 创建用户表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user'
            )
        """)
        
        # 插入初始的 admin 和 user 账号(如果表是空的) 用于测试阶段
        cursor.execute("SELECT COUNT(*) as count FROM users")
        result = cursor.fetchone()
        if result['count'] == 0:
            cursor.execute("INSERT INTO users (username, password, role) VALUES ('admin', '123', 'admin')")
            cursor.execute("INSERT INTO users (username, password, role) VALUES ('user', '123', 'user')")
            
        # 3. 创建系统配置表，并初始化默认搜索引擎
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                config_key VARCHAR(50) NOT NULL UNIQUE,
                config_value VARCHAR(255) NOT NULL
            )
        """)
        cursor.execute("SELECT COUNT(*) as count FROM system_config WHERE config_key='search_provider'")
        if cursor.fetchone()['count'] == 0:
            cursor.execute("INSERT INTO system_config (config_key, config_value) VALUES ('search_provider', 'serpapi')")
            
        conn.commit()
    conn.close()