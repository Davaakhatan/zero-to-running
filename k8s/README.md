# Kubernetes Manifests - Multi-Cloud Support

This directory contains Kubernetes manifests for deploying the Zero-to-Running Developer Environment to **AWS EKS**, **Azure AKS**, and **GCP GKE**.

## Structure

```
k8s/
├── README.md                    # This file
├── common/                      # Common manifests (shared across all clouds)
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── postgres-statefulset.yaml
│   ├── redis-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── app-frontend-deployment.yaml
│   └── dashboard-frontend-deployment.yaml
├── aws/                         # AWS EKS specific
│   ├── README.md
│   ├── storage-class.yaml
│   ├── ingress.yaml
│   └── deploy.sh
├── azure/                       # Azure AKS specific
│   ├── README.md
│   ├── storage-class.yaml
│   ├── ingress.yaml
│   └── deploy.sh
└── gcp/                         # GCP GKE specific
    ├── README.md
    ├── storage-class.yaml
    ├── ingress.yaml
    └── deploy.sh
```

## Quick Start

### AWS EKS
```bash
cd k8s/aws
./deploy.sh
```

### Azure AKS
```bash
cd k8s/azure
./deploy.sh
```

### GCP GKE
```bash
cd k8s/gcp
./deploy.sh
```

## Prerequisites

### Common (All Clouds)
- **kubectl**: Kubernetes CLI configured for your cluster
- **Docker**: For building images
- **Container Registry**: ECR (AWS), ACR (Azure), or GCR (GCP)

### AWS EKS
- AWS CLI configured
- EKS cluster created
- IAM permissions for EKS access
- ECR repository created

### Azure AKS
- Azure CLI configured
- AKS cluster created
- ACR registry created

### GCP GKE
- gcloud CLI configured
- GKE cluster created
- GCR or Artifact Registry repository created

## Cloud-Specific Differences

| Feature | AWS EKS | Azure AKS | GCP GKE |
|---------|---------|-----------|---------|
| Container Registry | ECR | ACR | GCR/Artifact Registry |
| Storage Class | `gp3` (EBS) | `managed-premium` | `standard` (GCE Persistent Disk) |
| Load Balancer | AWS ELB | Azure Load Balancer | GCP Load Balancer |
| Ingress Controller | AWS ALB Ingress | NGINX/Application Gateway | GKE Ingress |
| Image Format | `{account}.dkr.ecr.{region}.amazonaws.com/{repo}` | `{registry}.azurecr.io/{repo}` | `gcr.io/{project}/{repo}` or `{region}-docker.pkg.dev/{project}/{repo}` |

## Deployment Steps

### 1. Build and Push Docker Images

#### AWS (ECR)
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin {account}.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t {account}.dkr.ecr.us-east-1.amazonaws.com/dev-env-backend:latest ./backend
docker push {account}.dkr.ecr.us-east-1.amazonaws.com/dev-env-backend:latest
```

#### Azure (ACR)
```bash
# Login to ACR
az acr login --name {registry-name}

# Build and push
docker build -t {registry-name}.azurecr.io/dev-env-backend:latest ./backend
docker push {registry-name}.azurecr.io/dev-env-backend:latest
```

#### GCP (GCR/Artifact Registry)
```bash
# Login to GCR
gcloud auth configure-docker

# Build and push
docker build -t gcr.io/{project-id}/dev-env-backend:latest ./backend
docker push gcr.io/{project-id}/dev-env-backend:latest
```

### 2. Update Image References

Update the image references in:
- `common/backend-deployment.yaml`
- `common/app-frontend-deployment.yaml`
- `common/dashboard-frontend-deployment.yaml`

Or use cloud-specific overlays in `aws/`, `azure/`, or `gcp/` directories.

### 3. Update Secrets

**IMPORTANT**: Update `common/secrets.yaml` with production secrets. Do NOT commit real secrets to Git.

For production, use:
- **AWS**: AWS Secrets Manager or Parameter Store
- **Azure**: Azure Key Vault
- **GCP**: Secret Manager

### 4. Deploy

Choose your cloud provider and follow the specific README:
- [AWS EKS Deployment Guide](aws/README.md)
- [Azure AKS Deployment Guide](azure/README.md)
- [GCP GKE Deployment Guide](gcp/README.md)

## Accessing Services

### Port Forwarding (All Clouds)
```bash
# Backend API
kubectl port-forward service/backend-service 3003:3003 -n dev-env

# Application Frontend
kubectl port-forward service/app-frontend-service 3000:3000 -n dev-env

# Dashboard Frontend
kubectl port-forward service/dashboard-frontend-service 3001:3000 -n dev-env
```

### Ingress (Cloud-Specific)
Each cloud provider has its own ingress configuration. See cloud-specific README files.

## Troubleshooting

```bash
# Check pod status
kubectl get pods -n dev-env

# View logs
kubectl logs <pod-name> -n dev-env

# Check events
kubectl get events -n dev-env --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod <pod-name> -n dev-env
```

## Production Considerations

1. **Secrets Management**: Use cloud-native secret managers
2. **Storage**: Use managed storage classes for persistent volumes
3. **Networking**: Configure proper network policies
4. **Monitoring**: Set up cloud-native monitoring (CloudWatch, Azure Monitor, Cloud Monitoring)
5. **Scaling**: Configure HorizontalPodAutoscaler
6. **Backup**: Set up database backups
7. **TLS**: Configure TLS certificates for ingress
8. **Resource Quotas**: Set namespace resource quotas

## Cleanup

```bash
# Delete all resources
kubectl delete namespace dev-env

# Or delete individually
kubectl delete -f common/
kubectl delete -f {aws|azure|gcp}/
```
