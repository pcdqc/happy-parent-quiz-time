#!/bin/bash

# 亲子教育答题游戏 - 数据库迁移部署脚本

echo "🚀 开始部署数据库迁移..."

# 检查Supabase CLI是否安装
if ! command -v supabase &> /dev/null; then
    echo "❌ 请先安装Supabase CLI: https://supabase.com/docs/guides/cli"
    exit 1
fi

# 检查当前目录
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 发现以下迁移文件："
ls -la supabase/migrations/

echo ""
echo "🔧 请选择部署方式："
echo "1) 本地开发环境"
echo "2) 远程Supabase项目"
echo "3) 仅查看迁移状态"

read -p "请输入选项 (1/2/3): " choice

case $choice in
    1)
        echo "🏠 部署到本地开发环境..."
        supabase start
        supabase db reset
        echo "✅ 本地迁移完成！"
        ;;
    2)
        echo "🌐 部署到远程Supabase项目..."
        
        # 检查是否已链接项目
        if [ -f ".supabase/project-ref" ]; then
            project_ref=$(cat .supabase/project-ref)
            echo "🔗 已链接项目: $project_ref"
            supabase db push
        else
            echo "📡 请先链接项目:"
            echo "supabase login"
            echo "supabase link --project-ref your-project-ref"
            read -p "请输入项目ref: " project_ref
            supabase link --project-ref $project_ref
            supabase db push
        fi
        echo "✅ 远程迁移完成！"
        ;;
    3)
        echo "📊 查看迁移状态..."
        supabase migration list
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "🎉 迁移部署完成！"
echo "📊 可以使用以下命令检查："
echo "supabase migration list"
echo "supabase db status"