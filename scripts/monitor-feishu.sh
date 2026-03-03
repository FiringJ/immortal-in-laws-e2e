#!/bin/bash

# 飞书机器人测试监控脚本

echo "=========================================="
echo "🔍 飞书机器人实时监控"
echo "=========================================="
echo ""
echo "监控 Daemon 日志，等待飞书消息..."
echo ""
echo "按 Ctrl+C 停止监控"
echo ""
echo "=========================================="
echo ""

# 查找 Daemon 日志文件
DAEMON_LOG="/Users/firingj/.cursor/projects/Users-firingj-Projects-immortal-in-laws-e2e/terminals/304599.txt"

if [ ! -f "$DAEMON_LOG" ]; then
    echo "❌ 找不到 Daemon 日志文件"
    echo "请确保 Daemon 正在运行：npm run daemon"
    exit 1
fi

# 实时监控日志
tail -f "$DAEMON_LOG" | while read line; do
    # 高亮显示重要信息
    if [[ "$line" == *"收到飞书消息"* ]]; then
        echo "🎉 $line"
    elif [[ "$line" == *"任务"* ]]; then
        echo "📋 $line"
    elif [[ "$line" == *"来源"* ]]; then
        echo "📍 $line"
    elif [[ "$line" == *"用户"* ]]; then
        echo "👤 $line"
    elif [[ "$line" == *"错误"* ]] || [[ "$line" == *"Error"* ]]; then
        echo "❌ $line"
    else
        echo "$line"
    fi
done
