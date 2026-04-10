import os
from langchain_community.document_loaders import (
    PyPDFLoader, TextLoader, UnstructuredMarkdownLoader, Docx2txtLoader,
    UnstructuredExcelLoader, UnstructuredPowerPointLoader, CSVLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# 当前文件的父目录的父目录就是 backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KNOWLEDGE_BASE_DIR = os.path.join(BASE_DIR, 'knowledge_base')
DB_DIR = os.path.join(BASE_DIR, 'chroma_db')

# 定义您的多种格式加载器映射
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
    """
    遍历目录，根据文件后缀使用不同的 Loader 加载文档
    """
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
                    print(f"正在使用 {loader_class.__name__} 加载文件: {filename}")
                    loader = loader_class(file_path)
                    documents.extend(loader.load())
                except Exception as e:
                    print(f"加载文件 {filename} 失败: {e}")
            else:
                print(f"跳过不支持的文件格式: {filename}")
                
    return documents

def get_vectorstore():
    """
    核心 RAG 向量库构建函数
    """
    # 1. 动态加载多种格式文件
    docs = load_documents_from_dir(KNOWLEDGE_BASE_DIR)
    
    if not docs:
        print("警告: 知识库目录为空或没有支持的文档格式。")
        return None

    # 2. 文本切割
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(docs)

    # 3. 向量化并存入 ChromaDB
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


    vectorstore = Chroma.from_documents(
        documents=splits, 
        embedding=embeddings, 
        persist_directory=DB_DIR
    )
    
    print(f"成功将 {len(docs)} 个文件转换为向量存入 Chroma 库。")
    return vectorstore

def get_retriever():
    vectorstore = get_vectorstore()
    if vectorstore:
        return vectorstore.as_retriever(search_kwargs={"k": 3})
    return None