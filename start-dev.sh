#!/bin/bash
set -e  # 遇到错误立即退出

echo "🚀 启动MVP开发环境..."

# 检查Docker是否运行
echo "🔍 检查Docker状态..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi
echo "✅ Docker运行正常"

# 检查端口占用情况
echo "🔍 检查端口占用..."
for port in 3000 8000 5000 8080; do
    if lsof -i :$port > /dev/null 2>&1; then
        echo "⚠️  端口 $port 被占用，跳过映射"
    else
        echo "✅ 端口 $port 可用"
    fi
done

# 检查Dockerfile是否存在
if [ ! -f ".devcontainer/Dockerfile" ]; then
    echo "❌ 未找到 .devcontainer/Dockerfile"
    echo "请先创建配置文件"
    exit 1
fi
echo "✅ 找到Dockerfile配置"

# 构建容器
echo "📦 开始构建开发容器..."
docker build -t mvp-dev .devcontainer/ --progress=plain

echo "🏃 启动开发容器（使用可用端口）..."
docker run -it --rm \
    -v $(pwd):/workspace \
    -p 3001:3000 \
    -p 8001:8000 \
    -p 5001:5000 \
    -p 8081:8080 \
    --name mvp-dev-container \
    mvp-dev bash