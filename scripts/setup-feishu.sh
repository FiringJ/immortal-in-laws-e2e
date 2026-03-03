#!/bin/bash

# 飞书机器人一键配置脚本

echo "=========================================="
echo "🤖 飞书机器人配置助手"
echo "=========================================="
echo ""

# 检查 ngrok 是否已配置
if ! ngrok config check &>/dev/null; then
    echo "⚠️  ngrok 未配置 authtoken"
    echo ""
    echo "请按以下步骤操作："
    echo ""
    echo "1️⃣  访问 ngrok 注册页面："
    echo "   https://dashboard.ngrok.com/signup"
    echo ""
    echo "2️⃣  使用 GitHub/Google 账号注册（免费）"
    echo ""
    echo "3️⃣  获取 authtoken："
    echo "   https://dashboard.ngrok.com/get-started/your-authtoken"
    echo ""
    echo "4️⃣  配置 authtoken："
    echo "   ngrok config add-authtoken YOUR_TOKEN_HERE"
    echo ""
    echo "配置完成后，重新运行此脚本"
    echo ""
    
    # 尝试打开浏览器
    if command -v open &>/dev/null; then
        read -p "是否现在打开注册页面？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "https://dashboard.ngrok.com/signup"
        fi
    fi
    
    exit 1
fi

echo "✅ ngrok 已配置"
echo ""

# 启动 ngrok
echo "🚀 启动 ngrok..."
ngrok http 3000 > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# 等待 ngrok 启动
sleep 3

# 获取 ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ 无法获取 ngrok URL"
    echo "请检查 ngrok 是否正常启动"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ ngrok 已启动"
echo ""
echo "=========================================="
echo "📋 你的 ngrok URL："
echo "=========================================="
echo ""
echo "  $NGROK_URL"
echo ""
echo "=========================================="
echo ""

# 生成飞书配置信息
WEBHOOK_URL="${NGROK_URL}/feishu/webhook"

echo "🔧 飞书事件订阅配置："
echo ""
echo "  请求地址："
echo "  $WEBHOOK_URL"
echo ""
echo "=========================================="
echo ""

echo "📝 接下来的步骤："
echo ""
echo "1️⃣  访问飞书开放平台："
echo "   https://open.feishu.cn/"
echo ""
echo "2️⃣  进入你的应用 → 事件订阅"
echo ""
echo "3️⃣  配置请求地址（复制上面的 URL）："
echo "   $WEBHOOK_URL"
echo ""
echo "4️⃣  添加事件订阅："
echo "   - 接收消息 v2.0 (im.message.receive_v1)"
echo ""
echo "5️⃣  点击保存"
echo ""
echo "=========================================="
echo ""

# 尝试打开飞书开放平台
if command -v open &>/dev/null; then
    read -p "是否现在打开飞书开放平台？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "https://open.feishu.cn/"
    fi
fi

echo ""
echo "✅ 配置完成后，在飞书群里发送："
echo "   @Ralph Agent 还原 pages/settings/index 页面"
echo ""
echo "⚠️  保持此终端运行，不要关闭！"
echo ""
echo "按 Ctrl+C 停止 ngrok"
echo ""

# 保持运行
wait $NGROK_PID
