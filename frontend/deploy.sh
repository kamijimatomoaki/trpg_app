#!/bin/bash

# フロントエンドデプロイスクリプト
PROJECT_ID=${1:-"your-project-id"}
BACKEND_URL=${2:-"https://trpg-backend-xxx-uc.a.run.app"}

echo "🚀 Starting frontend deployment..."
echo "Project ID: $PROJECT_ID"
echo "Backend URL: $BACKEND_URL"

# 現在のディレクトリを確認
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# 依存関係のインストール
echo "📦 Installing dependencies..."
npm ci

# 本番用環境変数の設定
echo "🔧 Setting up production environment variables..."
cat > .env.production << EOF
VITE_API_BASE_URL=$BACKEND_URL
VITE_FIREBASE_API_KEY=\$VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=\$VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=$PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=\$VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=\$VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=\$VITE_FIREBASE_APP_ID
EOF

# ビルド実行
echo "🔨 Building for production..."
npm run build

# Firebase Hosting にデプロイ
echo "🚀 Deploying to Firebase Hosting..."
firebase use $PROJECT_ID
firebase deploy --only hosting

echo "✅ Frontend deployment completed!"
echo "🌐 Your app should be available at: https://$PROJECT_ID.web.app"