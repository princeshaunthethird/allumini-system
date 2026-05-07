#!/bin/bash
# AlumniConnect — Quick Start Script
set -e

echo "🎓 AlumniConnect Setup"
echo "======================"

# Check Python
python3 --version || { echo "❌ Python 3 not found"; exit 1; }
# Check Node
node --version || { echo "❌ Node.js not found"; exit 1; }
# Check PostgreSQL
psql --version || { echo "⚠️  psql not found — make sure PostgreSQL is running"; }

echo ""
echo "📦 Setting up Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet
cp .env.example .env
echo "✅ Backend dependencies installed"
echo "⚠️  Edit backend/.env with your DATABASE_URL and SECRET_KEY"

echo ""
echo "📦 Setting up Frontend..."
cd ../frontend
npm install --silent
cp .env.example .env
echo "✅ Frontend dependencies installed"

echo ""
echo "🚀 Ready to run!"
echo ""
echo "Terminal 1 — Backend:"
echo "  cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "Terminal 2 — Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Open: http://localhost:5173"
echo "API Docs: http://localhost:8000/api/docs"
