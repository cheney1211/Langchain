from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from werkzeug.utils import secure_filename
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
#from tools.agent_tools import get_agent_tools
from flask import Blueprint

#注册蓝图
api_bp = Blueprint('api', __name__, url_prefix='/api')

from .auth import auth_bp
from .chat import chat_bp
from .rag import rag_bp
from .admin_config import admin_bp
from .admin_users import admin_users_bp

api_bp.register_blueprint(auth_bp)
api_bp.register_blueprint(chat_bp)
api_bp.register_blueprint(rag_bp)
api_bp.register_blueprint(admin_bp)
api_bp.register_blueprint(admin_users_bp)