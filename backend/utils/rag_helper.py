import os
import shutil
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
                    print(f"正在使用 {loader_class.__name__} 加载文件: {file_path}")
                    
                    if loader_class == TextLoader:
                        try:
                            # 1. 优先尝试最常见的 UTF-8 编码
                            loader = loader_class(file_path, encoding='utf-8')
                            documents.extend(loader.load())
                        except Exception:
                            print(f"  -> UTF-8 加载失败，尝试 GBK 编码: {file_path}")
                            try:
                                # 2. 如果 UTF-8 失败，尝试国内常见的 GBK 编码
                                loader = loader_class(file_path, encoding='gbk')
                                documents.extend(loader.load())
                            except Exception:
                                # 3. 终极后备：使用系统默认编码
                                print(f"  -> GBK 也加载失败，尝试系统默认编码: {file_path}")
                                loader = loader_class(file_path)
                                documents.extend(loader.load())
                                
                    # 修复 2: 针对 CSVLoader 强制使用 utf-8 编码
                    elif loader_class == CSVLoader:
                        loader = loader_class(file_path, encoding='utf-8')
                        documents.extend(loader.load())
                     # 其他常规文档 (如 PDF, Word, Excel)
                    else:
                        loader = loader_class(file_path)
                        documents.extend(loader.load())
                except Exception as e:
                    print(f"加载文件 {filename} 失败: {e}")
            else:
                print(f"跳过不支持的文件格式: {filename}")
                
    return documents

# 使用单例模式加载模型，避免每次检索和构建都重复加载导致内存溢出或变慢
_embeddings = None
def get_embeddings():
    global _embeddings
    if _embeddings is None:
        model_name = "Qwen/Qwen3-Embedding-0.6B"
        model_kwargs = {
            'device': 'cuda',  
            'trust_remote_code': True 
        } 
        encode_kwargs = {'normalize_embeddings': True} # 向量归一化，提升检索精度
        print(f"⏳ 正在加载本地 Embedding 模型 {model_name}...")
        _embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs=model_kwargs,
            encode_kwargs=encode_kwargs
        )
    return _embeddings

def build_vectorstore():
    """
    后台任务：构建/更新 RAG 向量库。
    如果在上传和删除文件后调用此函数，将自动同步最新的文件库状态。
    """
    # 1. 每次重新构建前，清理旧的数据库数据以防数据冗余
    if os.path.exists(DB_DIR):
        print(f"🗑️ 检测到知识库文件变更，正在清空旧的向量数据库: {DB_DIR}")
        shutil.rmtree(DB_DIR)

    # 2. 动态加载多种格式文件
    docs = load_documents_from_dir(KNOWLEDGE_BASE_DIR)
    
    if not docs:
        print("警告: 知识库目录为空或没有支持的文档格式。向量库已清空。")
        return None

    # 3. 文本切割
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(docs)

    embeddings = get_embeddings()

    # 4. 向量化并存入 ChromaDB
    print("⏳ 正在构建 ChromaDB 向量存储...")
    vectorstore = Chroma.from_documents(
        documents=splits, 
        embedding=embeddings, 
        persist_directory=DB_DIR
    )
    
    print(f"✅ 成功将 {len(docs)} 个文件转换为向量存入 Chroma 库。")
    return vectorstore

def get_retriever():
    """
    仅在用户触发 RAG 时调用，快速加载现有的向量数据库。
    """
    if not os.path.exists(DB_DIR) or not os.listdir(DB_DIR):
        print("向量库尚未建立或文件已被清空。")
        return None
        
    embeddings = get_embeddings()
    vectorstore = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)
    return vectorstore.as_retriever(search_kwargs={"k": 3})