# 使用Python 3.10基础镜像
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    git \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制项目文件
COPY requirements.txt .
COPY src/ ./src/

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 下载模型 (deepseek和qwen3的7B版本)
RUN python -c "from huggingface_hub import snapshot_download; \
    snapshot_download(repo_id='deepseek-ai/deepseek-llm-7b', local_dir='/app/models/deepseek-7b'); \
    snapshot_download(repo_id='Qwen/Qwen-7B', local_dir='/app/models/qwen-7b')"

# 暴露服务端口
EXPOSE 8000 50051

# 启动服务
CMD ["python", "src/main.py"]