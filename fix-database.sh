#!/bin/bash

# 亲子教育答题游戏 - 数据库修复脚本
# 解决 quiz_results 表不存在的错误

echo "🚀 开始修复数据库结构..."

# 检查Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ 请先安装Supabase CLI: https://supabase.com/docs/guides/cli"
    echo "或者使用: npm install -g supabase"
    exit 1
fi

echo "📋 创建完整的数据库结构..."

# 重置并应用所有迁移（谨慎操作！）
read -p "⚠️  这将重置数据库并重新应用所有迁移。继续吗？(y/N): " confirm

if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo "🔧 应用完整的数据库迁移..."
    
    # 链接项目（如果未链接）
    if [ ! -f ".supabase/project-ref" ]; then
        echo "🔗 请先链接您的Supabase项目:"
        echo "supabase login"
        echo "supabase link --project-ref your-project-ref"
        read -p "请输入项目ref: " project_ref
        supabase link --project-ref $project_ref
    fi
    
    # 推送迁移
    echo "📊 推送数据库迁移..."
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据库迁移成功完成！"
        echo ""
        echo "🎉 现在您可以："
        echo "1. 运行应用: npm run dev"
        echo "2. 访问管理后台测试新功能"
        echo "3. 使用 supabase migration list 查看迁移状态"
    else
        echo "❌ 迁移过程中出现错误"
        echo "请检查错误信息并手动处理"
    fi
else
    echo "❌ 操作已取消"
    exit 1
fi