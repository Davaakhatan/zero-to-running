#!/bin/bash

# Multi-Cloud Deployment Script
# Helps you choose and deploy to AWS EKS, Azure AKS, or GCP GKE

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Zero-to-Running Developer Environment - Kubernetes Deployment"
echo "================================================================"
echo ""
echo "Which cloud provider do you want to deploy to?"
echo ""
echo "  1) AWS EKS (Amazon Elastic Kubernetes Service)"
echo "  2) Azure AKS (Azure Kubernetes Service)"
echo "  3) GCP GKE (Google Kubernetes Engine)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "✅ Selected: AWS EKS"
    echo ""
    echo "📋 Prerequisites:"
    echo "  • AWS CLI configured"
    echo "  • EKS cluster created"
    echo "  • kubectl configured for your EKS cluster"
    echo "  • ECR repositories created"
    echo ""
    read -p "Continue with AWS deployment? (y/n): " confirm
    if [[ $confirm == [yY] ]]; then
      cd "$SCRIPT_DIR/aws"
      ./deploy.sh
    else
      echo "Deployment cancelled."
      exit 0
    fi
    ;;
  2)
    echo ""
    echo "✅ Selected: Azure AKS"
    echo ""
    echo "📋 Prerequisites:"
    echo "  • Azure CLI configured"
    echo "  • AKS cluster created"
    echo "  • kubectl configured for your AKS cluster"
    echo "  • ACR registry created"
    echo ""
    read -p "Continue with Azure deployment? (y/n): " confirm
    if [[ $confirm == [yY] ]]; then
      cd "$SCRIPT_DIR/azure"
      ./deploy.sh
    else
      echo "Deployment cancelled."
      exit 0
    fi
    ;;
  3)
    echo ""
    echo "✅ Selected: GCP GKE"
    echo ""
    echo "📋 Prerequisites:"
    echo "  • gcloud CLI configured"
    echo "  • GKE cluster created"
    echo "  • kubectl configured for your GKE cluster"
    echo "  • GCR or Artifact Registry repository created"
    echo ""
    read -p "Continue with GCP deployment? (y/n): " confirm
    if [[ $confirm == [yY] ]]; then
      cd "$SCRIPT_DIR/gcp"
      ./deploy.sh
    else
      echo "Deployment cancelled."
      exit 0
    fi
    ;;
  *)
    echo "❌ Invalid choice. Please run the script again and select 1, 2, or 3."
    exit 1
    ;;
esac

