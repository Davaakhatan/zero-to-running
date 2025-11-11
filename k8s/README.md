# Kubernetes Manifests for AKS Deployment

This directory contains Kubernetes manifests for deploying the Zero-to-Running Developer Environment to Azure Kubernetes Service (AKS).

## Structure

```
k8s/
├── namespace.yaml                    # Namespace definition
├── configmap.yaml                    # Configuration (non-sensitive)
├── secrets.yaml                      # Secrets (sensitive data)
├── postgres-statefulset.yaml         # PostgreSQL database
├── redis-deployment.yaml              # Redis cache
├── backend-deployment.yaml            # Backend API
├── app-frontend-deployment.yaml      # Application Frontend
├── dashboard-frontend-deployment.yaml # Dashboard Frontend
├── ingress.yaml                      # Ingress (optional)
└── README.md                         # This file
```

## Prerequisites

1. **AKS Cluster**: Create or access an AKS cluster
2. **kubectl**: Configured to connect to your AKS cluster
3. **Azure Container Registry (ACR)**: For storing Docker images
4. **Docker Images**: Build and push images to ACR

## Deployment Steps

### 1. Build and Push Docker Images

```bash
# Login to Azure Container Registry
az acr login --name <your-acr-name>

# Build and push backend
docker build -t <your-acr-name>.azurecr.io/dev-env-backend:latest ./backend
docker push <your-acr-name>.azurecr.io/dev-env-backend:latest

# Build and push app-frontend
docker build -t <your-acr-name>.azurecr.io/dev-env-app-frontend:latest ./app-frontend
docker push <your-acr-name>.azurecr.io/dev-env-app-frontend:latest

# Build and push dashboard-frontend
docker build -t <your-acr-name>.azurecr.io/dev-env-dashboard-frontend:latest ./dashboard-frontend
docker push <your-acr-name>.azurecr.io/dev-env-dashboard-frontend:latest
```

### 2. Update Image References

Update the image references in:
- `backend-deployment.yaml`
- `app-frontend-deployment.yaml`
- `dashboard-frontend-deployment.yaml`

Replace `your-registry.azurecr.io` with your actual ACR name.

### 3. Update Secrets

**IMPORTANT**: Update `secrets.yaml` with production secrets. Do NOT commit real secrets to Git.

For production, use:
- Azure Key Vault
- Kubernetes Secrets Manager
- External secrets operator

### 4. Deploy to AKS

```bash
# Apply manifests in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/app-frontend-deployment.yaml
kubectl apply -f k8s/dashboard-frontend-deployment.yaml

# Optional: Apply ingress
kubectl apply -f k8s/ingress.yaml
```

### 5. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n dev-env

# Check services
kubectl get services -n dev-env

# Check logs
kubectl logs -f deployment/backend -n dev-env
```

## Accessing Services

### Without Ingress (Port Forwarding)

```bash
# Backend API
kubectl port-forward service/backend-service 3003:3003 -n dev-env

# Application Frontend
kubectl port-forward service/app-frontend-service 3000:3000 -n dev-env

# Dashboard Frontend
kubectl port-forward service/dashboard-frontend-service 3001:3000 -n dev-env
```

### With Ingress

Update `ingress.yaml` with your domain and configure DNS. Then access:
- Application: `http://app.yourdomain.com`
- Dashboard: `http://dashboard.yourdomain.com`
- API: `http://api.yourdomain.com`

## Configuration

### Environment Variables

Most configuration is in `configmap.yaml`. Update as needed for your environment.

### Resource Limits

Default resource limits are set. Adjust in each deployment file based on your needs:
- **PostgreSQL**: 256Mi-512Mi memory, 250m-500m CPU
- **Redis**: 128Mi-256Mi memory, 100m-200m CPU
- **Backend**: 256Mi-512Mi memory, 250m-500m CPU
- **Frontends**: 256Mi-512Mi memory, 250m-500m CPU

### Storage

- **PostgreSQL**: Uses PersistentVolumeClaim (10Gi)
- **Redis**: Uses emptyDir (ephemeral) - change to PVC for production

## Health Checks

All services have:
- **Liveness Probe**: Restarts container if unhealthy
- **Readiness Probe**: Only routes traffic when ready

## Init Containers

Dependency ordering is handled by init containers:
- Backend waits for PostgreSQL and Redis
- Frontends wait for Backend

## Troubleshooting

```bash
# Check pod status
kubectl describe pod <pod-name> -n dev-env

# View logs
kubectl logs <pod-name> -n dev-env

# Check events
kubectl get events -n dev-env --sort-by='.lastTimestamp'

# Debug pod
kubectl exec -it <pod-name> -n dev-env -- sh
```

## Production Considerations

1. **Secrets Management**: Use Azure Key Vault or Kubernetes Secrets Manager
2. **Storage**: Use Azure Managed Disks for persistent volumes
3. **Networking**: Configure proper network policies
4. **Monitoring**: Set up Azure Monitor or Prometheus
5. **Scaling**: Configure HorizontalPodAutoscaler
6. **Backup**: Set up database backups
7. **TLS**: Configure TLS certificates for ingress
8. **Resource Quotas**: Set namespace resource quotas

## Cleanup

```bash
# Delete all resources
kubectl delete namespace dev-env

# Or delete individually
kubectl delete -f k8s/
```

