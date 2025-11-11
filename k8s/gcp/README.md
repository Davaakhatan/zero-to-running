# GCP GKE Deployment Guide

Deploy Zero-to-Running Developer Environment to Google Kubernetes Engine (GKE).

## Prerequisites

1. **gcloud CLI** configured with appropriate credentials
2. **kubectl** installed and configured
3. **GKE Cluster** created
4. **GCR or Artifact Registry** repository created for Docker images

## Setup

### 1. Create GKE Cluster (if not exists)

```bash
# Set variables
PROJECT_ID=your-project-id
CLUSTER_NAME=dev-env-cluster
ZONE=us-central1-a

# Set project
gcloud config set project $PROJECT_ID

# Create GKE cluster
gcloud container clusters create $CLUSTER_NAME \
  --zone $ZONE \
  --num-nodes 2 \
  --machine-type e2-medium \
  --enable-autorepair \
  --enable-autoupgrade
```

### 2. Configure kubectl

```bash
gcloud container clusters get-credentials $CLUSTER_NAME --zone $ZONE
```

### 3. Enable Container Registry API

```bash
gcloud services enable containerregistry.googleapis.com
```

### 4. Build and Push Docker Images

#### Using GCR (legacy)
```bash
# Build and push backend
docker build -t gcr.io/$PROJECT_ID/dev-env-backend:latest ./backend
docker push gcr.io/$PROJECT_ID/dev-env-backend:latest

# Build and push app-frontend
docker build -t gcr.io/$PROJECT_ID/dev-env-app-frontend:latest ./app-frontend
docker push gcr.io/$PROJECT_ID/dev-env-app-frontend:latest

# Build and push dashboard-frontend
docker build -t gcr.io/$PROJECT_ID/dev-env-dashboard-frontend:latest ./dashboard-frontend
docker push gcr.io/$PROJECT_ID/dev-env-dashboard-frontend:latest
```

#### Using Artifact Registry (recommended)
```bash
# Create repository
gcloud artifacts repositories create dev-env-repo \
  --repository-format=docker \
  --location=$ZONE

# Configure Docker
gcloud auth configure-docker $ZONE-docker.pkg.dev

# Build and push
docker build -t $ZONE-docker.pkg.dev/$PROJECT_ID/dev-env-repo/dev-env-backend:latest ./backend
docker push $ZONE-docker.pkg.dev/$PROJECT_ID/dev-env-repo/dev-env-backend:latest
```

### 5. Update Image References

Update the image references in `../common/` deployment files:
- Replace `YOUR_REGISTRY` with `gcr.io/$PROJECT_ID` or `$ZONE-docker.pkg.dev/$PROJECT_ID/dev-env-repo`

## Deploy

```bash
# Apply common manifests
kubectl apply -f ../common/

# Apply GCP-specific manifests
kubectl apply -f storage-class.yaml
kubectl apply -f ingress.yaml

# Or use the deployment script
./deploy.sh
```

## Storage

GCP GKE uses Persistent Disks. The storage class uses `standard` (default) or `premium` for better performance.

## Ingress

GKE has built-in ingress support. The ingress uses GKE Ingress Controller.

### Enable Ingress

```bash
# Ingress is enabled by default in GKE
# No additional installation needed
```

## Access Services

### Port Forwarding
```bash
kubectl port-forward service/backend-service 3003:3003 -n dev-env
```

### Via Ingress
After deploying ingress, get the external IP:
```bash
kubectl get ingress -n dev-env
```

## Secrets Management

For production, use Google Secret Manager:

```bash
# Store secret
echo -n "your-password" | gcloud secrets create postgres-password --data-file=-

# Use Secret Manager CSI Driver
```

## Monitoring

- **Cloud Monitoring**: GKE monitoring and logging
- **Cloud Trace**: Distributed tracing
- **Cloud Logging**: Centralized logging

## Cleanup

```bash
# Delete resources
kubectl delete namespace dev-env

# Delete GKE cluster (optional)
gcloud container clusters delete $CLUSTER_NAME --zone $ZONE
```

