#!/bin/bash

# Ralph Daemon 清理脚本

set -e

echo "🧹 Ralph Daemon 清理脚本"
echo "========================"
echo ""

# 默认保留天数
KEEP_DAYS=${1:-7}

echo "保留最近 $KEEP_DAYS 天的数据"
echo ""

# 清理旧日志
echo "1️⃣  清理旧日志..."

if [ -d logs ]; then
    OLD_LOGS=$(find logs -name "*.log" -mtime +$KEEP_DAYS)
    if [ -n "$OLD_LOGS" ]; then
        echo "$OLD_LOGS" | wc -l | xargs echo "   找到"
        echo "   个旧日志文件"
        find logs -name "*.log" -mtime +$KEEP_DAYS -delete
        echo "✅ 旧日志已清理"
    else
        echo "✅ 无需清理日志"
    fi
else
    echo "⚠️  日志目录不存在"
fi

echo ""

# 清理旧截图
echo "2️⃣  清理旧截图..."

if [ -d screenshots ]; then
    OLD_SCREENSHOTS=$(find screenshots -name "*.png" -mtime +$KEEP_DAYS)
    if [ -n "$OLD_SCREENSHOTS" ]; then
        echo "$OLD_SCREENSHOTS" | wc -l | xargs echo "   找到"
        echo "   个旧截图"
        find screenshots -name "*.png" -mtime +$KEEP_DAYS -delete
        echo "✅ 旧截图已清理"
    else
        echo "✅ 无需清理截图"
    fi
else
    echo "⚠️  截图目录不存在"
fi

echo ""

# 清理旧运行日志（可选，默认保留 30 天）
RUN_LOG_KEEP_DAYS=${2:-30}

echo "3️⃣  清理旧运行日志（保留 $RUN_LOG_KEEP_DAYS 天）..."

if [ -d agent-memory/restoration-runs ]; then
    OLD_RUN_LOGS=$(find agent-memory/restoration-runs -name "*.md" -mtime +$RUN_LOG_KEEP_DAYS)
    if [ -n "$OLD_RUN_LOGS" ]; then
        echo "$OLD_RUN_LOGS" | wc -l | xargs echo "   找到"
        echo "   个旧运行日志"
        
        read -p "是否清理旧运行日志？(y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            find agent-memory/restoration-runs -name "*.md" -mtime +$RUN_LOG_KEEP_DAYS -delete
            echo "✅ 旧运行日志已清理"
        else
            echo "⏭️  跳过清理运行日志"
        fi
    else
        echo "✅ 无需清理运行日志"
    fi
else
    echo "⚠️  运行日志目录不存在"
fi

echo ""

# 清理 Midscene 运行报告
echo "4️⃣  清理 Midscene 运行报告..."

if [ -d midscene_run ]; then
    OLD_MIDSCENE=$(find midscene_run -mtime +$KEEP_DAYS)
    if [ -n "$OLD_MIDSCENE" ]; then
        echo "$OLD_MIDSCENE" | wc -l | xargs echo "   找到"
        echo "   个旧报告"
        find midscene_run -mtime +$KEEP_DAYS -delete
        echo "✅ Midscene 报告已清理"
    else
        echo "✅ 无需清理 Midscene 报告"
    fi
else
    echo "⚠️  Midscene 目录不存在"
fi

echo ""

# 显示清理后的磁盘使用情况
echo "5️⃣  磁盘使用情况..."

if [ -d logs ]; then
    echo "   logs/: $(du -sh logs | cut -f1)"
fi

if [ -d screenshots ]; then
    echo "   screenshots/: $(du -sh screenshots | cut -f1)"
fi

if [ -d agent-memory/restoration-runs ]; then
    echo "   restoration-runs/: $(du -sh agent-memory/restoration-runs | cut -f1)"
fi

if [ -d midscene_run ]; then
    echo "   midscene_run/: $(du -sh midscene_run | cut -f1)"
fi

echo ""
echo "========================"
echo "清理完成"
echo ""
echo "💡 提示："
echo "   默认保留 $KEEP_DAYS 天的日志和截图"
echo "   运行日志保留 $RUN_LOG_KEEP_DAYS 天"
echo ""
echo "   自定义保留天数："
echo "   ./scripts/cleanup.sh 14      # 保留 14 天"
echo "   ./scripts/cleanup.sh 7 60    # 日志保留 7 天，运行日志保留 60 天"
echo ""
