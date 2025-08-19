# 使用Ubuntu基础镜像
FROM node:18

# 安装基础工具
RUN apt-get update && apt-get install -y \
    git \
    vim \
    curl \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 先以root身份安装Claude Code
RUN npm install -g @anthropic-ai/claude-code

# 创建普通用户
RUN useradd -m -s /bin/bash developer

# 设置工作目录
WORKDIR /workspace
RUN chown developer:developer /workspace

# 切换到普通用户
USER developer

# 暴露端口
EXPOSE 3000 8000 5000 8080

CMD ["bash"]

# alpine 创建用户比较复杂 换一个ubuntu的镜像
# FROM node:18-alpine

# # 安装基础工具
# RUN apk add --no-cache git bash vim curl python3 py3-pip build-base sudo

# # 直接使用root用户（简化版）
# WORKDIR /workspace

# # 安装Claude Code
# RUN npm install -g @anthropic-ai/claude-code

# CMD ["bash"]




# # 使用本地可用的基础镜像
# FROM node:18-alpine

# # 安装基础工具和sudo
# RUN apk add --no-cache \
#     git \
#     bash \
#     vim \
#     curl \
#     python3 \
#     py3-pip \
#     build-base \
#     sudo

# # 创建开发用户（修复Alpine Linux语法）
# RUN addgroup -g 1000 vscode && \
#     adduser -u 1000 -G vscode -s /bin/bash -D vscode && \
#     echo "vscode ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/vscode && \
#     chmod 0440 /etc/sudoers.d/vscode

# # 设置工作目录
# WORKDIR /workspace

# # 切换到开发用户
# USER vscode

# # 安装Claude Code
# RUN npm install -g @anthropic-ai/claude-code

# # 暴露端口
# EXPOSE 3000 8000 5000 8080

# # 默认命令
# CMD ["bash"]