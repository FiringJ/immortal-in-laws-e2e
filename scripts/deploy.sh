#!/bin/bash

# Ralph Daemon 一键部署脚本

set -e

echo "🚀 Ralph Daemon 部署脚本"
echo "========================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未安装 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未安装 npm"
    exit 1
fi

echo "✅ npm 版本: $(npm -v)"
echo ""

# 安装依赖
echo "📦 安装依赖..."
npm install
echo "✅ 依赖安装完成"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件"
    echo "📝 从 .env.example 创建 .env..."
    cp .env.example .env
    echo "✅ .env 文件已创建"
    echo ""
    echo "⚠️  请编辑 .env 文件，填入以下信息："
    echo "   - FEISHU_WEBHOOK_URL（飞书 Webhook URL）"
    echo "   - FIGMA_ACCESS_TOKEN（Figma Access Token）"
    echo ""
    read -p "是否现在编辑 .env 文件？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    else
        echo "⚠️  请稍后手动编辑 .env 文件"
        exit 0
    fi
else
    echo "✅ .env 文件已存在"
fi
echo ""

# 创建日志目录
echo "📁 创建日志目录..."
mkdir -p logs
echo "✅ 日志目录已创建"
echo ""

# 测试配置
echo "🧪 测试配置..."

# 检查飞书 Webhook
if grep -q "your-webhook-token" .env; then
    echo "⚠️  警告：飞书 Webhook URL 未配置"
    echo "   请编辑 .env 文件，填入正确的 FEISHU_WEBHOOK_URL"
fi

# 检查 Figma Token
if grep -q "your-figma-token" .env; then
    echo "⚠️  警告：Figma Access Token 未配置"
    echo "   请编辑 .env 文件，填入正确的 FIGMA_ACCESS_TOKEN"
fi

echo ""

# 询问部署方式
echo "请选择部署方式："
echo "1) 内置 CLI（简单，适合开发/测试）"
echo "2) PM2（推荐，适合生产环境）"
echo "3) 仅测试，不启动"
echo ""
read -p "请选择 (1/2/3): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo ""
        echo "🚀 使用内置 CLI 启动守护进程..."
        npm run daemon:start
        echo ""
        echo "✅ 守护进程已启动"
        echo ""
        echo "📝 常用命令："
        echo "   npm run daemon:status  - 查看状态"
        echo "   npm run daemon:logs    - 查看日志"
        echo "   npm run daemon:stop    - 停止守护进程"
        echo ""
        ;;
    2)
        # 检查 PM2
        if ! command -v pm2 &> /dev/null; then
            echo "⚠️  未安装 PM2"
            read -p "是否现在安装 PM2？(y/n) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "📦 安装 PM2..."
                npm install -g pm2
                echo "✅ PM2 安装完成"
            else
                echo "❌ 取消部署"
                exit 0
            fi
        fi
        
        echo ""
        echo "🚀 使用 PM2 启动守护进程..."
        pm2 start ecosystem.config.js
        echo ""
        echo "✅ 守护进程已启动"
        echo ""
        echo "📝 常用命令："
        echo "   pm2 status             - 查看状态"
        echo "   pm2 logs ralph-daemon  - 查看日志"
        echo "   pm2 restart ralph-daemon - 重启"
        echo "   pm2 stop ralph-daemon  - 停止"
        echo ""
        
        # 询问是否设置开机自启
        read -p "是否设置开机自启？(y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            pm2 startup
            pm2 save
            echo "✅ 开机自启已设置"
        fi
        ;;
    3)
        echo ""
        echo "🧪 运行测试..."
        echo ""
        
        # 测试任务调度器
        echo "1️⃣  测试任务调度器..."
        npm run loop:runner
        echo ""
        
        # 测试飞书通知
        echo "2️⃣  测试飞书通知..."
        read -p "是否测试飞书通知？(y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm run notify:feishu
        fi
        echo ""
        
        echo "✅ 测试完成"
        echo ""
        echo "📝 启动守护进程："
        echo "   npm run daemon:start   - 使用内置 CLI"
        echo "   pm2 start ecosystem.config.js - 使用 PM2"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎉 部署完成！"
echo ""
echo "📚 更多文档："
echo "   QUICKSTART.md              - 快速开始"
echo "   src/daemon/README.md       - 完整文档"
echo "   src/daemon/ARCHITECTURE.md - 架构设计"
echo ""
