from . import *
from utils.db import get_db_connection

admin_bp = Blueprint('admin', __name__)

# ==========================================
# 路由：管理员配置
# ==========================================
@admin_bp.route('/admin_config', methods=['GET', 'POST'])
def manage_config():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if request.method == 'POST':
                new_config = request.json
                provider = new_config.get('provider', 'serpapi').lower()
                
                # 写入或更新数据库中的搜索引擎配置
                cursor.execute("""
                    INSERT INTO system_config (config_key, config_value) 
                    VALUES ('search_provider', %s)
                    ON DUPLICATE KEY UPDATE config_value = %s
                """, (provider, provider))
                conn.commit()
                
                # 同步到当前进程的环境变量中，确保后端其它依赖该环境变量的功能立即生效
                os.environ["SEARCH_PROVIDER"] = provider
                return jsonify({"status": "success", "message": f"引擎已切换为 {provider}"})
            
            # GET 请求：从数据库中读取
            cursor.execute("SELECT config_value FROM system_config WHERE config_key = 'search_provider'")
            row = cursor.fetchone()
            # 如果数据库里有值就取值，否则取环境变量或默认值
            provider = row['config_value'] if row else os.environ.get("SEARCH_PROVIDER", "serpapi")
            
            return jsonify({"provider": provider})
    except Exception as e:
        return jsonify({"status": "error", "message": f"数据库错误: {str(e)}"}), 500
    finally:
        conn.close()