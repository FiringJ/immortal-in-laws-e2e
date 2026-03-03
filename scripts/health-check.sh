#!/bin/bash

# Ralph Daemon 健康检查脚本

set -e

echo "🏥 Ralph Daemon 健康检查"
echo "========================"
echo ""

# 检查进程状态
echo "1️⃣  检查进程状态..."

if [ -f /tmp/ralph-daemon.pid ]; then
    PID=$(cat /tmp/ralph-daemon.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ 守护进程正在运行 (PID: $PID)"
    else
        echo "❌ 守护进程未运行（存在 PID 文件但进程不存在）"
        rm /tmp/ralph-daemon.pid
    fi
else
    # 检查 PM2
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "ralph-daemon"; then
            echo "✅ 守护进程正在运行（PM2）"
        else
            echo "❌ 守护进程未运行"
        fi
    else
        echo "❌ 守护进程未运行（无 PID 文件）"
    fi
fi

echo ""

# 检查日志文件
echo "2️⃣  检查日志文件..."

if [ -f logs/ralph-daemon.log ]; then
    LOG_SIZE=$(du -h logs/ralph-daemon.log | cut -f1)
    LOG_LINES=$(wc -l < logs/ralph-daemon.log)
    echo "✅ 日志文件存在"
    echo "   大小: $LOG_SIZE"
    echo "   行数: $LOG_LINES"
    
    # 检查最近的错误
    ERROR_COUNT=$(grep -i error logs/ralph-daemon.log | wc -l)
    if [ $ERROR_COUNT -gt 0 ]; then
        echo "⚠️  发现 $ERROR_COUNT 个错误"
        echo "   最近的错误："
        grep -i error logs/ralph-daemon.log | tail -3
    fi
else
    echo "⚠️  日志文件不存在"
fi

echo ""

# 检查任务状态
echo "3️⃣  检查任务状态..."

if command -v tsx &> /dev/null; then
    TASK_STATUS=$(npm run loop:runner:json 2>/dev/null || echo "{}")
    
    PENDING_COUNT=$(echo $TASK_STATUS | grep -o '"pendingCount":[0-9]*' | grep -o '[0-9]*' || echo "0")
    BLOCKED_COUNT=$(echo $TASK_STATUS | grep -o '"blockedCount":[0-9]*' | grep -o '[0-9]*' || echo "0")
    
    echo "   待处理任务: $PENDING_COUNT"
    echo "   冻结任务: $BLOCKED_COUNT"
    
    if [ $BLOCKED_COUNT -gt 0 ]; then
        echo "⚠️  有 $BLOCKED_COUNT 个任务被冻结"
    fi
else
    echo "⚠️  无法检查任务状态（tsx 未安装）"
fi

echo ""

# 检查磁盘空间
echo "4️⃣  检查磁盘空间..."

DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
echo "   磁盘使用率: $DISK_USAGE%"

if [ $DISK_USAGE -gt 90 ]; then
    echo "❌ 磁盘空间不足（使用率 > 90%）"
elif [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️  磁盘空间紧张（使用率 > 80%）"
else
    echo "✅ 磁盘空间充足"
fi

echo ""

# 检查截图目录
echo "5️⃣  检查截图目录..."

if [ -d screenshots ]; then
    SCREENSHOT_COUNT=$(find screenshots -name "*.png" | wc -l)
    SCREENSHOT_SIZE=$(du -sh screenshots | cut -f1)
    echo "   截图数量: $SCREENSHOT_COUNT"
    echo "   总大小: $SCREENSHOT_SIZE"
    
    if [ $SCREENSHOT_COUNT -gt 1000 ]; then
        echo "⚠️  截图数量过多，建议清理"
    fi
else
    echo "⚠️  截图目录不存在"
fi

echo ""

# 检查运行日志
echo "6️⃣  检查运行日志..."

if [ -d agent-memory/restoration-runs ]; then
    RUN_LOG_COUNT=$(find agent-memory/restoration-runs -name "*.md" | wc -l)
    echo "   运行日志数量: $RUN_LOG_COUNT"
    
    # 最近的运行日志
    LATEST_LOG=$(find agent-memory/restoration-runs -name "*.md" -type f -print0 | xargs -0 ls -t | head -1)
    if [ -n "$LATEST_LOG" ]; then
        LATEST_LOG_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$LATEST_LOG" 2>/dev/null || stat -c "%y" "$LATEST_LOG" 2>/dev/null | cut -d'.' -f1)
        echo "   最近运行: $LATEST_LOG_TIME"
    fi
else
    echo "⚠️  运行日志目录不存在"
fi

echo ""

# 检查环境变量
echo "7️⃣  检查环境变量..."

if [ -f .env ]; then
    echo "✅ .env 文件存在"
    
    if grep -q "your-webhook-token" .env; then
        echo "⚠️  飞书 Webhook URL 未配置"
    else
        echo "✅ 飞书 Webhook URL 已配置"
    fi
    
    if grep -q "your-figma-token" .env; then
        echo "⚠️  Figma Access Token 未配置"
    else
        echo "✅ Figma Access Token 已配置"
    fi
else
    echo "❌ .env 文件不存在"
fi

echo ""
echo "========================"
echo "健康检查完成"
echo ""
