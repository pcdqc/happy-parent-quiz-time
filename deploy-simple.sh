#!/bin/bash

# 简化版数据库部署脚本
# 解决列不存在的问题

echo "🚀 开始简化版数据库部署..."

# 检查Supabase CLI
if ! command -v supabase >/dev/null 2>&1; then
    echo "❌ 请先安装Supabase CLI:"
    echo "npm install -g supabase"
    exit 1
fi

# 检查项目配置
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ 未找到supabase配置，请在项目根目录运行"
    exit 1
fi

echo "📋 部署步骤："
echo "1. 确保已登录: supabase login"
echo "2. 确保已链接项目: supabase link --project-ref your-project-ref"
echo ""

# 列出可用的迁移文件
echo "📁 可用的迁移文件："
ls -la supabase/migrations/

echo ""
echo "🎯 推荐执行顺序："
echo "1. supabase db reset -- 重置数据库（谨慎使用）"
echo "2. supabase db push -- 推送所有迁移"
echo ""

# 提供手动执行选项
read -p "是否立即执行推送？(y/N): " execute_now

if [[ $execute_now == [yY] ]]; then
    echo "📊 推送数据库迁移..."
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo "✅ 迁移成功完成！"
        
        echo ""
        echo "🔧 设置管理员用户："
        echo "需要在Supabase Dashboard中设置用户metadata:"
        echo "{\"is_admin\": true, \"role\": \"admin\"}"
        echo ""
        echo "或者使用SQL："
        echo "UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{\"is_admin\": true}' WHERE email = 'your-email@example.com';"
        
    else
        echo "❌ 迁移失败，请检查错误信息"
    fi
else
    echo "📋 请手动执行以下命令："
    echo "supabase db push"
fi

echo ""
echo "🎉 部署完成！"