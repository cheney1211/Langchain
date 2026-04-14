import os
import shutil
import time
import gc
import threading
import chromadb
from chromadb.config import Settings
from langchain_community.document_loaders import (
    PyPDFLoader, TextLoader, UnstructuredMarkdownLoader, Docx2txtLoader,
    UnstructuredExcelLoader, UnstructuredPowerPointLoader, CSVLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma  # 使用更现代的 langchain-chroma 库

# 当前文件的父目录的父目录就是 backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KNOWLEDGE_BASE_DIR = os.path.join(BASE_DIR, 'knowledge_base')
DB_DIR = os.path.join(BASE_DIR, 'chroma_db')

# 线程锁
db_lock = threading.Lock()

LOADERS = {
    '.pdf': PyPDFLoader,
    '.txt': TextLoader,
    '.md': UnstructuredMarkdownLoader,
    '.docx': Docx2txtLoader,
    '.xlsx': UnstructuredExcelLoader,
    '.xls': UnstructuredExcelLoader,
    '.pptx': UnstructuredPowerPointLoader,
    '.csv': CSVLoader,
    '.py': TextLoader,
    '.js': TextLoader,
    '.html': TextLoader,
    '.css': TextLoader
}

def load_documents_from_dir(directory):
    """遍历目录，加载文档"""
    documents = []
    if not os.path.exists(directory):
        return documents

    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            ext = os.path.splitext(filename)[1].lower()
            loader_class = LOADERS.get(ext)
            if loader_class:
                try:
                    if loader_class == TextLoader:
                        try:
                            loader = loader_class(file_path, encoding='utf-8')
                            documents.extend(loader.load())
                        except Exception:
                            loader = loader_class(file_path, encoding='gbk')
                            documents.extend(loader.load())
                    elif loader_class == CSVLoader:
                        loader = loader_class(file_path, encoding='utf-8')
                        documents.extend(loader.load())
                    else:
                        loader = loader_class(file_path)
                        documents.extend(loader.load())
                except Exception as e:
                    print(f"加载文件 {filename} 失败: {e}")
    return documents

_embeddings = None
def get_embeddings():
    global _embeddings
    if _embeddings is None:
        model_name = "Qwen/Qwen3-Embedding-0.6B"
        model_kwargs = {'device': 'cuda', 'trust_remote_code': True} 
        encode_kwargs = {'normalize_embeddings': True}
        print(f"⏳ 正在加载本地 Embedding 模型 {model_name}...")
        _embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs=model_kwargs,
            encode_kwargs=encode_kwargs
        )
    return _embeddings

# 全局变量
_active_vectorstore = None
_chroma_client = None

def get_client():
    """获取原生的 Chroma 客户端"""
    global _chroma_client
    if _chroma_client is None:
        # 允许重置数据库，这是官方推荐的清理方式
        _chroma_client = chromadb.PersistentClient(
            path=DB_DIR,
            settings=Settings(allow_reset=True)
        )
    return _chroma_client

def build_vectorstore():
    """后台任务：使用官方方法重置并构建 RAG 向量库"""
    global _active_vectorstore, _chroma_client
    
    with db_lock:
        print("🗑️ 正在清空旧的向量数据库内容...")
        
        # 1. 显式释放之前的 LangChain 包装对象
        _active_vectorstore = None
        gc.collect()
        time.sleep(1)

        try:
            # 2. 使用官方客户端执行重置操作
            client = get_client()
            client.reset()  # 这会清空数据库但保留结构，且比删除文件夹更安全
            print("✅ 向量数据库已通过官方 API 重置")
        except Exception as e:
            print(f"⚠️ 官方重置失败，尝试常规清理: {e}")
            # 如果 reset 不可用，尝试手动清理文件夹（作为兜底）
            _chroma_client = None # 彻底释放客户端
            gc.collect()
            time.sleep(1)
            if os.path.exists(DB_DIR):
                try:
                    shutil.rmtree(DB_DIR)
                    print("✅ 文件夹清理成功")
                except Exception as ex:
                    print(f"❌ 严重错误: 无法清理数据库目录: {ex}")
                    return None

        # 3. 加载与切割
        docs = load_documents_from_dir(KNOWLEDGE_BASE_DIR)
        if not docs:
            print("警告: 知识库为空。")
            return None

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        embeddings = get_embeddings()

        # 4. 重新构建
        print("⏳ 正在构建索引...")
        # 再次获取（或重新创建）客户端
        client = get_client()
        vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=embeddings,
            client=client, # 将原生客户端传入 LangChain 包装器
            collection_name="rag_collection"
        )
        
        _active_vectorstore = vectorstore
        print(f"✅ RAG 索引构建完成，共 {len(splits)} 个片段。")
        return vectorstore

def get_retriever():
    """获取检索器"""
    global _active_vectorstore
    
    if _active_vectorstore is None:
        if not os.path.exists(DB_DIR):
            return None
        try:
            embeddings = get_embeddings()
            client = get_client()
            _active_vectorstore = Chroma(
                client=client,
                embedding_function=embeddings,
                collection_name="rag_collection"
            )
        except Exception as e:
            print(f"加载向量库失败: {e}")
            return None
            
    return _active_vectorstore.as_retriever(search_kwargs={"k": 3})