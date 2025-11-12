#!/bin/bash
# Quick AWS EKS Test Script
# Creates cluster, builds images, and deploys

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME=${CLUSTER_NAME:-dev-env-cluster}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "🚀 Quick AWS EKS Test"
echo "===================="
echo "Region: $AWS_REGION"
echo "Cluster: $CLUSTER_NAME"
echo "Account: $AWS_ACCOUNT_ID"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI not found. Install: brew install awscli"; exit 1; }
command -v eksctl >/dev/null 2>&1 || { echo "❌ eksctl not found. Install: brew install eksctl"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl not found. Install: brew install kubectl"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Install Docker Desktop"; exit 1; }

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials not configured. Run: aws configure"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Ask for confirmation
read -p "This will create an EKS cluster (~$200/month). Continue? (y/n): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Cancelled."
    exit 0
fi

# 1. Create cluster
echo ""
echo "📦 Step 1: Creating EKS cluster (this takes 15-20 minutes)..."
if eksctl get cluster --name $CLUSTER_NAME --region $AWS_REGION >/dev/null 2>&1; then
    echo "✅ Cluster already exists, skipping creation"
else
    # Check if we can use default VPC (to avoid VPC limit issues)
    DEFAULT_VPC=$(aws ec2 describe-vpcs --region $AWS_REGION \
      --filters "Name=isDefault,Values=true" \
      --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "")
    
    if [ -n "$DEFAULT_VPC" ] && [ "$DEFAULT_VPC" != "None" ]; then
        echo "  Using existing default VPC: $DEFAULT_VPC"
        # Get subnets from default VPC (need at least 2 in different AZs)
        SUBNET_INFO=$(aws ec2 describe-subnets --region $AWS_REGION \
          --filters "Name=vpc-id,Values=$DEFAULT_VPC" \
          --query 'Subnets[*].[SubnetId,AvailabilityZone,MapPublicIpOnLaunch]' --output text)
        
        # Parse subnets into arrays
        PUBLIC_SUBNETS=()
        PRIVATE_SUBNETS=()
        AZ_SET=()
        
        while IFS=$'\t' read -r subnet_id az is_public; do
            if [ "$is_public" = "True" ]; then
                PUBLIC_SUBNETS+=("$subnet_id")
            else
                PRIVATE_SUBNETS+=("$subnet_id")
            fi
            # Track unique AZs
            if [[ ! " ${AZ_SET[@]} " =~ " ${az} " ]]; then
                AZ_SET+=("$az")
            fi
        done <<< "$SUBNET_INFO"
        
        # Use public subnets if available, otherwise use all subnets
        if [ ${#PUBLIC_SUBNETS[@]} -ge 2 ]; then
            USE_SUBNETS=("${PUBLIC_SUBNETS[@]}")
            echo "  Using ${#PUBLIC_SUBNETS[@]} public subnets"
        else
            ALL_SUBNETS=($(echo "$SUBNET_INFO" | cut -f1))
            USE_SUBNETS=("${ALL_SUBNETS[@]}")
            echo "  Using ${#ALL_SUBNETS[@]} subnets (mix of public/private)"
        fi
        
        if [ ${#USE_SUBNETS[@]} -lt 2 ]; then
            echo "  ⚠️  Warning: Need at least 2 subnets in different AZs"
            echo "  Falling back to creating new VPC..."
            eksctl create cluster \
                --name $CLUSTER_NAME \
                --region $AWS_REGION \
                --node-type t3.small \
                --nodes 1 \
                --nodes-min 1 \
                --nodes-max 2 \
                --managed \
                --with-oidc
        else
            # Create cluster config with existing VPC and subnets
            CLUSTER_CONFIG="/tmp/eks-cluster-config-$$.yaml"
            cat > $CLUSTER_CONFIG <<EOFCONFIG
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: $CLUSTER_NAME
  region: $AWS_REGION

vpc:
  id: $DEFAULT_VPC
  subnets:
    public:
EOFCONFIG
            # Add subnets grouped by AZ (use first 2 unique AZs)
            SEEN_AZS=()
            COUNT=0
            while IFS=$'\t' read -r subnet_id az is_public; do
                if [[ " ${USE_SUBNETS[@]} " =~ " ${subnet_id} " ]]; then
                    # Check if we've already added a subnet for this AZ
                    AZ_SEEN=false
                    for seen_az in "${SEEN_AZS[@]}"; do
                        if [ "$seen_az" = "$az" ]; then
                            AZ_SEEN=true
                            break
                        fi
                    done
                    
                    # Add subnet if AZ not seen yet and we haven't added 2 AZs
                    if [ "$AZ_SEEN" = false ] && [ $COUNT -lt 2 ]; then
                        echo "      $az: { id: $subnet_id }" >> $CLUSTER_CONFIG
                        SEEN_AZS+=("$az")
                        COUNT=$((COUNT+1))
                    fi
                fi
            done <<< "$SUBNET_INFO"
            
            cat >> $CLUSTER_CONFIG <<EOFCONFIG

nodeGroups:
  - name: ng-1
    instanceType: t3.small
    desiredCapacity: 1
    minSize: 1
    maxSize: 2
    ssh:
      allow: false
EOFCONFIG
            eksctl create cluster -f $CLUSTER_CONFIG
            rm -f $CLUSTER_CONFIG
        fi
    else
        # Try creating new VPC (may fail if at limit)
        eksctl create cluster \
            --name $CLUSTER_NAME \
            --region $AWS_REGION \
            --node-type t3.small \
            --nodes 1 \
            --nodes-min 1 \
            --nodes-max 2 \
            --managed \
            --with-oidc
    fi
    echo "✅ Cluster created"
fi

# Configure kubectl
aws eks update-kubeconfig --name $CLUSTER_NAME --region $AWS_REGION >/dev/null 2>&1
echo "✅ kubectl configured"

# 2. Create ECR repos
echo ""
echo "📦 Step 2: Creating ECR repositories..."
for repo in dev-env-backend dev-env-app-frontend dev-env-dashboard-frontend dev-env-collabcanva; do
    if aws ecr describe-repositories --repository-names $repo --region $AWS_REGION >/dev/null 2>&1; then
        echo "  ✅ $repo already exists"
    else
        aws ecr create-repository --repository-name $repo --region $AWS_REGION >/dev/null 2>&1
        echo "  ✅ Created $repo"
    fi
done

# 3. Build and push images
echo ""
echo "🔨 Step 3: Building and pushing Docker images..."
echo "  Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com >/dev/null 2>&1

ECR_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

cd "$PROJECT_ROOT"

echo "  Building backend..."
docker build -t $ECR_URL/dev-env-backend:latest ./backend >/dev/null 2>&1
docker push $ECR_URL/dev-env-backend:latest >/dev/null 2>&1
echo "  ✅ Backend pushed"

echo "  Building app-frontend..."
docker build -t $ECR_URL/dev-env-app-frontend:latest ./app-frontend >/dev/null 2>&1
docker push $ECR_URL/dev-env-app-frontend:latest >/dev/null 2>&1
echo "  ✅ App frontend pushed"

echo "  Building dashboard-frontend..."
docker build -t $ECR_URL/dev-env-dashboard-frontend:latest ./dashboard-frontend >/dev/null 2>&1
docker push $ECR_URL/dev-env-dashboard-frontend:latest >/dev/null 2>&1
echo "  ✅ Dashboard frontend pushed"

echo "  Building collabcanva..."
docker build -t $ECR_URL/dev-env-collabcanva:latest --target production ./collabcanva-app >/dev/null 2>&1
docker push $ECR_URL/dev-env-collabcanva:latest >/dev/null 2>&1
echo "  ✅ CollabCanva pushed"

# 4. Update image references
echo ""
echo "📝 Step 4: Updating image references..."
cd "$PROJECT_ROOT/k8s/common"

# Backup original files
cp backend-deployment.yaml backend-deployment.yaml.bak
cp app-frontend-deployment.yaml app-frontend-deployment.yaml.bak
cp dashboard-frontend-deployment.yaml dashboard-frontend-deployment.yaml.bak
cp collabcanva-deployment.yaml collabcanva-deployment.yaml.bak 2>/dev/null || true

# Update image URLs
sed -i.bak "s|YOUR_REGISTRY|$ECR_URL|g" backend-deployment.yaml
sed -i.bak "s|YOUR_REGISTRY|$ECR_URL|g" app-frontend-deployment.yaml
sed -i.bak "s|YOUR_REGISTRY|$ECR_URL|g" dashboard-frontend-deployment.yaml
sed -i.bak "s|971422717446.dkr.ecr.us-east-1.amazonaws.com|$ECR_URL|g" collabcanva-deployment.yaml 2>/dev/null || true

echo "  ✅ Image references updated"

# 5. Deploy
echo ""
echo "🚀 Step 5: Deploying to EKS..."
cd "$PROJECT_ROOT/k8s/aws"
./deploy.sh

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check status:"
echo "   kubectl get pods -n dev-env"
echo ""
echo "🌐 Access services via port-forwarding:"
echo "   kubectl port-forward service/backend-service 3003:3003 -n dev-env"
echo "   kubectl port-forward service/app-frontend-service 3000:3000 -n dev-env"
echo "   kubectl port-forward service/dashboard-frontend-service 3001:3000 -n dev-env"
echo "   kubectl port-forward service/collabcanva-service 3002:3002 -n dev-env"
echo ""
echo "🧹 To cleanup:"
echo "   eksctl delete cluster --name $CLUSTER_NAME --region $AWS_REGION"

