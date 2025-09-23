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

## 🔧 初期セットアップ

### 1. Google Cloud Project 設定

```bash
# プロジェクト作成
gcloud projects create your-project-id

# プロジェクトを設定
gcloud config set project your-project-id

# 必要なAPIを有効化
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
```

### 2. Firebase プロジェクト設定

```bash
# Firebase CLIでログイン
firebase login

# Firebase プロジェクトを初期化
firebase init hosting
firebase init firestore
```

### 3. サービスアカウント作成

```bash
# サービスアカウント作成
gcloud iam service-accounts create trpg-service-account

# 必要な権限を付与
gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:trpg-service-account@your-project-id.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# キーファイル生成
gcloud iam service-accounts keys create firebase-key.json \
    --iam-account=trpg-service-account@your-project-id.iam.gserviceaccount.com
```

## 🚀 デプロイ手順

### 手動デプロイ

#### バックエンド (Cloud Run)

```bash
cd backend

# 環境変数を設定
cp .env.production .env
# .envファイルを編集して実際の値を設定

# デプロイ実行
./deploy.sh your-project-id us-central1
```

#### フロントエンド (Firebase Hosting)

```bash
cd frontend

# 環境変数を設定
cp .env.production.example .env.production
# .env.productionファイルを編集して実際の値を設定

# デプロイ実行
./deploy.sh your-project-id https://your-backend-url
```

### 自動デプロイ (GitHub Actions)

#### 1. GitHub Secrets 設定

以下のsecretsをGitHubリポジトリに設定：

```
GCP_PROJECT_ID=your-project-id
GCP_SA_KEY=<base64 encoded service account key>
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_SERVICE_ACCOUNT=<firebase service account json>
```

#### 2. デプロイブランチにプッシュ

```bash
git checkout -b deploy
git push origin deploy
```

## 📝 設定ファイル

### バックエンド環境変数

```bash
# backend/.env
PROJECT_ID=your-project-id
LOCATION=us-central1
FIREBASE_ADMIN_KEY_PATH=/secrets/firebase-key.json
```

### フロントエンド環境変数

```bash
# frontend/.env.production
VITE_API_BASE_URL=https://your-backend-url
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 🔍 トラブルシューティング

### よくある問題

1. **認証エラー**
   - サービスアカウントキーが正しく設定されているか確認
   - 必要なIAM権限が付与されているか確認

2. **CORS エラー**
   - バックエンドのCORS設定を確認
   - フロントエンドのAPIベースURLが正しいか確認

3. **動画生成エラー**
   - Vertex AI APIが有効になっているか確認
   - 適切なquotaが設定されているか確認

### ログ確認

```bash
# Cloud Run ログ
gcloud logs read --service=trpg-backend --limit=50

# Firebase Hosting ログ
firebase hosting:logs
```

## 🔄 アップデート手順

1. コードを修正
2. `deploy` ブランチにプッシュ
3. GitHub Actionsが自動実行
4. デプロイ完了を確認

## 📊 モニタリング

- **Cloud Run**: Google Cloud Console
- **Firebase Hosting**: Firebase Console
- **Vertex AI**: Cloud Console AI Platform

---

## 🎯 Next Steps

1. カスタムドメインの設定
2. SSL証明書の設定
3. CDNの設定
4. モニタリング・アラートの設定