# Remote Access Guide

How to give people remote access to your applications running on AWS EKS.

## Quick Access Options

### Option 1: AWS Application Load Balancer (ALB) - Recommended for Production

This is the proper way to expose your applications publicly.

#### Step 1: Install AWS Load Balancer Controller (if not installed)

```bash
# Add EKS Helm chart repository
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install AWS Load Balancer Controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$(kubectl config current-context | cut -d'/' -f2) \
  --set serviceAccount.create=true \
  --set region=us-east-1  # Change to your region
```

**Note**: You may need to create IAM policy and service account. See [AWS Documentation](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html).

#### Step 2: Wait for ALB to be Provisioned

After applying the ingress, wait 2-5 minutes for AWS to create the ALB:

```bash
# Check ingress status
kubectl get ingress dev-env-ingress -n dev-env -w

# Get ALB URL (once ADDRESS appears)
kubectl get ingress dev-env-ingress -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

#### Step 3: Access Your Applications

Once you have the ALB hostname (e.g., `k8s-devenv-devenv-xxxxx.us-east-1.elb.amazonaws.com`):

**Option A: Use ALB Hostname Directly (Quick Demo)**

You can access your apps using the ALB hostname with the `Host` header:

```bash
# Dashboard
curl -H "Host: dashboard.yourdomain.com" http://<ALB_HOSTNAME>

# CollabCanva
curl -H "Host: collabcanva.yourdomain.com" http://<ALB_HOSTNAME>
```

Or use a browser extension like "ModHeader" to set the Host header.

**Option B: Configure DNS (Recommended)**

1. Get your ALB hostname:
   ```bash
   ALB_HOSTNAME=$(kubectl get ingress dev-env-ingress -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
   echo $ALB_HOSTNAME
   ```

2. Create DNS records pointing to the ALB:
   - `dashboard.yourdomain.com` → CNAME → `<ALB_HOSTNAME>`
   - `collabcanva.yourdomain.com` → CNAME → `<ALB_HOSTNAME>`
   - `api.yourdomain.com` → CNAME → `<ALB_HOSTNAME>`

3. Update ingress.yaml with your actual domain:
   ```yaml
   - host: dashboard.yourdomain.com  # Replace with your domain
   - host: collabcanva.yourdomain.com  # Replace with your domain
   ```

4. Apply updated ingress:
   ```bash
   kubectl apply -f k8s/aws/ingress.yaml
   ```

5. Access via your domain:
   - Dashboard: `http://dashboard.yourdomain.com`
   - CollabCanva: `http://collabcanva.yourdomain.com`

### Option 2: LoadBalancer Service Type (Quick Access - No Ingress)

For immediate access without setting up ingress, change service type to LoadBalancer:

```bash
# Create temporary LoadBalancer services
kubectl patch svc dashboard-frontend-service -n dev-env -p '{"spec":{"type":"LoadBalancer"}}'
kubectl patch svc collabcanva-service -n dev-env -p '{"spec":{"type":"LoadBalancer"}}'

# Wait for AWS to provision ELB (2-5 minutes)
kubectl get svc -n dev-env -w

# Get LoadBalancer URLs
kubectl get svc dashboard-frontend-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
kubectl get svc collabcanva-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

**Access URLs:**
- Dashboard: `http://<DASHBOARD_ELB_HOSTNAME>`
- CollabCanva: `http://<COLLABCANVA_ELB_HOSTNAME>`

**Note**: This creates separate load balancers for each service (more expensive). Revert to ClusterIP when done:
```bash
kubectl patch svc dashboard-frontend-service -n dev-env -p '{"spec":{"type":"ClusterIP"}}'
kubectl patch svc collabcanva-service -n dev-env -p '{"spec":{"type":"ClusterIP"}}'
```

### Option 3: Port Forwarding (Temporary Testing)

For quick testing/demos, use port-forwarding:

```bash
# Terminal 1: Dashboard
kubectl port-forward service/dashboard-frontend-service 3001:3000 -n dev-env

# Terminal 2: CollabCanva
kubectl port-forward service/collabcanva-service 3002:3002 -n dev-env
```

**Access URLs:**
- Dashboard: `http://localhost:3001` (only accessible from your machine)
- CollabCanva: `http://localhost:3002` (only accessible from your machine)

**For Remote Access**: Use SSH tunnel:
```bash
# On your local machine
ssh -L 3001:localhost:3001 -L 3002:localhost:3002 user@your-ec2-instance

# Then run port-forward on the EC2 instance
```

### Option 4: NodePort (Quick Internal Access)

Expose services on node ports:

```bash
# Patch services to NodePort
kubectl patch svc dashboard-frontend-service -n dev-env -p '{"spec":{"type":"NodePort"}}'
kubectl patch svc collabcanva-service -n dev-env -p '{"spec":{"type":"NodePort"}}'

# Get node IP and port
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')
DASHBOARD_PORT=$(kubectl get svc dashboard-frontend-service -n dev-env -o jsonpath='{.spec.ports[0].nodePort}')
COLLABCANVA_PORT=$(kubectl get svc collabcanva-service -n dev-env -o jsonpath='{.spec.ports[0].nodePort}')

echo "Dashboard: http://$NODE_IP:$DASHBOARD_PORT"
echo "CollabCanva: http://$NODE_IP:$COLLABCANVA_PORT"
```

**Note**: Ensure your EKS node security groups allow traffic on these ports.

## Recommended Approach

1. **For Quick Demo**: Use Option 2 (LoadBalancer) - fastest way to get public URLs
2. **For Production**: Use Option 1 (ALB Ingress) with DNS - most cost-effective and scalable
3. **For Testing**: Use Option 3 (Port Forwarding) - no AWS costs

## Troubleshooting

### ALB Not Appearing

1. Check AWS Load Balancer Controller logs:
   ```bash
   kubectl logs -n kube-system deployment/aws-load-balancer-controller
   ```

2. Verify IAM permissions for the controller service account

3. Check ingress events:
   ```bash
   kubectl describe ingress dev-env-ingress -n dev-env
   ```

### Services Not Accessible

1. Verify pods are running:
   ```bash
   kubectl get pods -n dev-env
   ```

2. Check service endpoints:
   ```bash
   kubectl get endpoints -n dev-env
   ```

3. Test from within cluster:
   ```bash
   kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- curl http://dashboard-frontend-service:3000
   ```

## Security Considerations

- **HTTPS**: Configure TLS certificates in ingress for production
- **Authentication**: Add authentication layer (OAuth, API keys, etc.)
- **Network Policies**: Restrict access using Kubernetes Network Policies
- **WAF**: Use AWS WAF with ALB for additional protection

## Cost Estimate

- **ALB Ingress**: ~$16/month + data transfer
- **LoadBalancer (per service)**: ~$16/month per service + data transfer
- **Port Forwarding**: Free (but requires SSH access)
- **NodePort**: Free (but requires security group configuration)

