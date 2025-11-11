# Azure AKS Deployment Guide

Deploy Zero-to-Running Developer Environment to Azure Kubernetes Service (AKS).

## Prerequisites

1. **Azure CLI** configured with appropriate credentials
2. **kubectl** installed and configured
3. **AKS Cluster** created
4. **ACR Registry** created for Docker images

## Setup

### 1. Create AKS Cluster (if not exists)

```bash
# Set variables
RESOURCE_GROUP=dev-env-rg
AKS_CLUSTER=dev-env-cluster
LOCATION=eastus

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create AKS cluster
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --enable-managed-identity \
  --generate-ssh-keys
```

### 2. Configure kubectl

```bash
az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_CLUSTER
```

### 3. Create ACR Registry

```bash
ACR_NAME=devenv$(date +%s | cut -c 6-10)  # Unique name

az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic
```

### 4. Attach ACR to AKS

```bash
az aks update -n $AKS_CLUSTER -g $RESOURCE_GROUP --attach-acr $ACR_NAME
```

### 5. Build and Push Docker Images

```bash
# Login to ACR
az acr login --name $ACR_NAME

# Build and push backend
docker build -t $ACR_NAME.azurecr.io/dev-env-backend:latest ./backend
docker push $ACR_NAME.azurecr.io/dev-env-backend:latest

# Build and push app-frontend
docker build -t $ACR_NAME.azurecr.io/dev-env-app-frontend:latest ./app-frontend
docker push $ACR_NAME.azurecr.io/dev-env-app-frontend:latest

# Build and push dashboard-frontend
docker build -t $ACR_NAME.azurecr.io/dev-env-dashboard-frontend:latest ./dashboard-frontend
docker push $ACR_NAME.azurecr.io/dev-env-dashboard-frontend:latest
```

### 6. Update Image References

Update the image references in `../common/` deployment files:
- Replace `YOUR_REGISTRY` with `$ACR_NAME.azurecr.io`

## Deploy

```bash
# Apply common manifests
kubectl apply -f ../common/

# Apply Azure-specific manifests
kubectl apply -f storage-class.yaml
kubectl apply -f ingress.yaml

# Or use the deployment script
./deploy.sh
```

## Storage

Azure AKS uses Azure Managed Disks. The storage class uses `managed-premium` for better performance.

## Ingress

The ingress uses NGINX Ingress Controller or Azure Application Gateway.

### Install NGINX Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz
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

For production, use Azure Key Vault:

```bash
# Store secret
az keyvault secret set --vault-name dev-env-kv --name postgres-password --value "your-password"

# Use Azure Key Vault Provider for Secrets Store CSI Driver
```

## Monitoring

- **Azure Monitor**: Container Insights for AKS
- **Application Insights**: Application performance monitoring
- **Log Analytics**: Centralized logging

## Cleanup

```bash
# Delete resources
kubectl delete namespace dev-env

# Delete AKS cluster (optional)
az aks delete --resource-group $RESOURCE_GROUP --name $AKS_CLUSTER --yes

# Delete ACR (optional)
az acr delete --resource-group $RESOURCE_GROUP --name $ACR_NAME --yes
```

