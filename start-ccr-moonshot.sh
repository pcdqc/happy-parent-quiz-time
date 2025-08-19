#!/bin/bash

# 设置环境变量
export ANTHROPIC_BASE_URL=https://api.moonshot.cn/anthropic
export ANTHROPIC_AUTH_TOKEN=sk-SD9NGFXeMvO0REVzPJwP7zilrK8TLWIzjQdanfEE7RiDKySo
export ANTHROPIC_API_KEY=$ANTHROPIC_AUTH_TOKEN  # Claude Code 可能需要这个
export OPENAI_API_KEY=$ANTHROPIC_AUTH_TOKEN     # 兼容性设置
export OPENAI_BASE_URL=$ANTHROPIC_BASE_URL      # 兼容性设置

echo "环境变量已设置："
echo "ANTHROPIC_BASE_URL: $ANTHROPIC_BASE_URL"
echo "ANTHROPIC_AUTH_TOKEN: ${ANTHROPIC_AUTH_TOKEN:0:10}..."

# 停止现有服务
ccr stop

# 等待
sleep 2

# 启动 CCR
ccr code
