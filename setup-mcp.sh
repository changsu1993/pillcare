#!/bin/bash

echo "🚀 PillCare 프로젝트 - MCP 서버 설치 시작..."
echo ""

# Node.js 버전 확인
echo "📦 Node.js 버전 확인 중..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "   https://nodejs.org 에서 Node.js를 설치해주세요."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION 감지됨"
echo ""

# 필수 MCP 서버 설치
echo "📥 필수 MCP 서버 설치 중..."
echo ""

echo "1️⃣  Filesystem MCP 서버 설치 중..."
npm install -g @modelcontextprotocol/server-filesystem
if [ $? -eq 0 ]; then
    echo "✅ Filesystem MCP 서버 설치 완료"
else
    echo "⚠️  Filesystem MCP 서버 설치 실패 (계속 진행)"
fi
echo ""

echo "2️⃣  Memory MCP 서버 설치 중..."
npm install -g @modelcontextprotocol/server-memory
if [ $? -eq 0 ]; then
    echo "✅ Memory MCP 서버 설치 완료"
else
    echo "⚠️  Memory MCP 서버 설치 실패 (계속 진행)"
fi
echo ""

echo "ℹ️  참고: SQLite, Git, Playwright MCP 서버는 현재 npm에 없습니다."
echo "   이 서버들은 GitHub에서 직접 클론하여 사용해야 합니다."
echo "   https://github.com/modelcontextprotocol/servers"
echo ""

# 선택적 MCP 서버
echo "📦 선택적 MCP 서버 설치 (필요시)..."
echo "   - Firebase MCP (커뮤니티): 아직 공식 패키지 없음"
echo "   - Google Calendar MCP (커뮤니티): 아직 공식 패키지 없음"
echo ""

echo "✅ MCP 서버 설치 완료!"
echo ""
echo "다음 단계:"
echo "  1. .claude/mcp.json 파일 확인"
echo "  2. Claude Code 재시작"
echo "  3. MCP 서버 사용 가능 확인"
echo ""
