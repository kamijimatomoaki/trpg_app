# AI TRPG Agent

🎲 **AI駆動のテーブルトークRPGアプリケーション**

Gemini 2.5とVertex AI Veoを活用した次世代TRPGプラットフォーム。リアルタイムマルチプレイヤー対応で、AI がゲームマスターとして物語を紡ぎます。

## ✨ 主な機能

### 🤖 AI ゲームマスター
- **Gemini 2.5 Pro**: 高度な物語生成とゲーム進行
- **Function Calling**: 自然なダイス判定システム
- **動的シナリオ**: プレイヤーの行動に応じた物語展開

### 🎬 動画生成機能
- **Vertex AI Veo**: オープニング・エピローグ動画の自動生成
- **ハイライト映像**: 冒険の名場面を8秒動画で記録
- **AI プロンプト**: 物語内容に基づく映像生成

### 🌐 リアルタイム マルチプレイヤー
- **Firebase Firestore**: リアルタイム同期
- **ターンベース**: 順序管理された協力プレイ
- **キャラクター作成**: 詳細なプロフィール設定

### 🎯 ゲーム機能
- **シナリオ選択**: 多様な冒険テーマ
- **自動終了判定**: AI による物語完了の検知
- **手動終了**: ホストによる強制完了機能
- **冒険記録**: テキスト・動画でのダウンロード

## 🚀 技術スタック

### バックエンド
- **FastAPI**: 高性能Web API
- **Python 3.9+**: メインプログラミング言語
- **Firebase Admin SDK**: データベース管理
- **Google Cloud Vertex AI**: AI モデル統合

### フロントエンド
- **React 18**: モダンなUI フレームワーク
- **TypeScript**: 型安全な開発
- **Material-UI (MUI)**: 美しいUIコンポーネント
- **Zustand**: 軽量状態管理
- **Vite**: 高速ビルドツール

### インフラ
- **Firebase Firestore**: NoSQL リアルタイムデータベース
- **Google Cloud Storage**: ファイル・動画保存
- **Firebase Authentication**: ユーザー認証

## 📋 必要な環境変数

```bash
# Google Cloud
PROJECT_ID=your-project-id
LOCATION=us-central1

# Firebase
FIREBASE_ADMIN_KEY_PATH=path/to/serviceAccount.json

# Frontend Firebase Config
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

## 🛠️ セットアップ手順

### 1. バックエンド セットアップ

```bash
# 依存関係のインストール
pip install -r requirements.txt

# Firebase サービスアカウントキーの配置
# Google Cloud Console から JSON キーをダウンロード

# サーバー起動
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. フロントエンド セットアップ

```bash
cd frontend

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

### 3. Firebase セットアップ

```bash
# Firebase CLI のインストール
npm install -g firebase-tools

# Firebase プロジェクトの初期化
firebase login
firebase init firestore

# Firestore ルールとインデックスのデプロイ
firebase deploy --only firestore
```

## 🎮 使用方法

1. **部屋作成**: ホストが新しいゲームルームを作成
2. **プレイヤー参加**: 部屋IDで他のプレイヤーが参加
3. **シナリオ選択**: 投票でゲームシナリオを決定
4. **キャラクター作成**: 各プレイヤーがキャラクターを設定
5. **ゲーム開始**: AI ゲームマスターが物語を開始
6. **協力プレイ**: ターン制で行動を決定し物語を進行
7. **エピローグ**: AI が冒険を総括し動画を生成

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │────│   FastAPI        │────│  Vertex AI      │
│   (Frontend)    │    │   (Backend)      │    │  (Gemini/Veo)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        
         │                        │                        
         └────────────────────────┼────────────────────────┘
                                  │                        
                        ┌─────────▼──────────┐             
                        │   Firebase         │             
                        │   (Firestore/Auth) │             
                        └────────────────────┘             
```

## 📜 ライセンス

このプロジェクトはハッカソン提出作品です。

## 🤝 貢献

ハッカソン期間中のため、コントリビューションは受け付けておりません。

---

**🎲 AI と共に紡ぐ、新しい冒険の物語を体験してください！**