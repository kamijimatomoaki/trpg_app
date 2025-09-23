#!/bin/bash

# プロジェクトIDを設定
PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-central1"}
SERVICE_NAME="trpg-backend"

echo "🚀 Starting deployment to Cloud Run..."
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"

# 現在のディレクトリを確認
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found. Please run this script from the backend directory."
    exit 1
fi

# Google Cloud設定
echo "📋 Setting up Google Cloud configuration..."
gcloud config set project $PROJECT_ID

# Container Registryにイメージをビルド・プッシュ
echo "🔨 Building and pushing Docker image..."
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
gcloud builds submit --tag $IMAGE_NAME

# Cloud Runにデプロイ
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 1 \
    --timeout 3600 \
    --max-instances 10 \
    --min-instances 0 \
    --concurrency 100 \
    --port 8080

echo "✅ Deployment completed!"
echo "🌐 Service URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'