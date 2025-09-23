# 🚀 AI TRPG Agent デプロイメントガイド

このガイドでは、AI TRPG AgentをGoogle Cloud Platform（GCP）にデプロイする方法を説明します。

## 📋 前提条件

### 必要なツール
- Google Cloud SDK (`gcloud`)
- Docker
- Node.js 18+
- Firebase CLI

### GCPサービス
- Cloud Run (バックエンド)
- Firebase Hosting (フロントエンド)
- Firestore (データベース)
- Cloud Storage (ファイル保存)
- Vertex AI (Gemini & Veo)

## 🏗️ アーキテクチャ

```
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Firebase Hosting  │────│   Cloud Run      │────│  Vertex AI      │
│   (Frontend/CDN)    │    │   (Backend API)  │    │  (Gemini/Veo)   │
└─────────────────────┘    └──────────────────┘    └─────────────────┘
          │                          │                        
          └──────────────────────────┼────────────────────────┘
                                     │                        
                           ┌─────────▼──────────┐             
                           │   Firestore        │             
                           │   (Database)       │             
                           └────────────────────┘             
```

## 🚀 手動デプロイ手順

### バックエンド (Cloud Run)

```bash
cd backend

# Dockerイメージをビルド
docker build -t gcr.io/PROJECT_ID/trpg-backend .

# Container Registryにプッシュ
docker push gcr.io/PROJECT_ID/trpg-backend

# Cloud Runにデプロイ
gcloud run deploy trpg-backend \
    --image gcr.io/PROJECT_ID/trpg-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 1 \
    --timeout 3600 \
    --max-instances 10
```

### フロントエンド (Firebase Hosting)

```bash
cd frontend

# 依存関係のインストール
npm install

# 本番ビルド
npm run build

# Firebase Hostingにデプロイ
firebase deploy --only hosting
```

## 📝 必要な設定

### 環境変数設定
- PROJECT_ID: Google CloudプロジェクトID
- LOCATION: us-central1
- FIREBASE_ADMIN_KEY_PATH: サービスアカウントキーのパス

### API URL設定
フロントエンドの`src/services/api.ts`でバックエンドURLを更新してください。

---

詳細な手順は各デプロイスクリプトを参照してください。