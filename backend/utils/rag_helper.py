import os
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import DashScopeEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

load_dotenv()

def get_retriever():
    """初始化并返回本地 PDF 知识库检索器"""
    # 1. 加载指定目录下的所有 PDF 文档
    loader = PyPDFDirectoryLoader("knowledge_base")
    docs = loader.load()

    if not docs:
        print("⚠️ 警告：在 knowledge_base 目录下没有找到 PDF 文件！")

    # 2. 文档切分 
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    splits = text_splitter.split_documents(docs)

    # 3. 初始化 Embedding 模型 
    model_name = "Qwen/Qwen3-Embedding-0.6B"
    
    # 添加 trust_remote_code=True 允许加载自定义模型架构
    model_kwargs = {
        'device': 'cuda',  
        'trust_remote_code': True 
    } 
    encode_kwargs = {'normalize_embeddings': True}

    print(f"⏳ 正在加载本地 Embedding 模型 {model_name}...")
    print("💡 提示：该模型较大（约1-2GB），首次运行下载可能需要较长时间，请耐心等待。")
    
    embeddings = HuggingFaceEmbeddings(
        model_name=model_name,
        model_kwargs=model_kwargs,
        encode_kwargs=encode_kwargs
    )
    # 4. 构建 Chroma 向量数据库

    vectorstore = Chroma.from_documents(
    documents=splits, 
    embedding=embeddings, 
    persist_directory="./chroma_db" 
)

    # 5. 转化为检索器，每次召回最相关的 3 个段落（可根据需要调整 k 的值）
    return vectorstore.as_retriever(search_kwargs={"k": 3})