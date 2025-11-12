# Kubernetes Demo Commands

Quick reference commands for showing AWS/Kubernetes environment during demo.

---

## 🔍 Check Pods Status

```bash
# Show all pods in dev-env namespace
kubectl get pods -n dev-env

# Show pods with more details (status, restarts, age)
kubectl get pods -n dev-env -o wide

# Watch pods in real-time (updates every 2 seconds)
kubectl get pods -n dev-env -w
```

---

## 🔌 Port Forwarding (While Docker Setup is Starting)

Show these commands while `make dev` is running to demonstrate Kubernetes alternative:

```bash
# Backend API (Port 3003)
kubectl port-forward service/backend-service 3003:3003 -n dev-env

# Dashboard Frontend (Port 3001)
kubectl port-forward service/dashboard-frontend-service 3001:3000 -n dev-env

# App Frontend (Port 3000)
kubectl port-forward service/app-frontend-service 3000:3000 -n dev-env

# CollabCanva (Port 3002)
kubectl port-forward service/collabcanva-service 3002:3002 -n dev-env
```

**Note**: Run these in separate terminal windows/tabs. They run in foreground.

---

## 🛑 Stop Port Forwarding

After Docker setup completes, stop all port-forwarding:

```bash
# Stop all port-forwarding processes
pkill -f "kubectl port-forward"

# Or stop specific port-forward (if running in foreground, use Ctrl+C)
# If running in background, find and kill:
ps aux | grep "kubectl port-forward" | grep -v grep
kill <PID>
```

---

## 🌐 Show AWS Environment

After stopping port-forwarding, show AWS environment:

### Check Services

```bash
# Show all services with LoadBalancer URLs
kubectl get svc -n dev-env

# Show only LoadBalancer services
kubectl get svc -n dev-env | grep LoadBalancer
```

### Get Public URLs

```bash
# Dashboard Frontend
kubectl get svc dashboard-frontend-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# CollabCanva
kubectl get svc collabcanva-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# App Frontend
kubectl get svc app-frontend-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Backend API
kubectl get svc backend-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### Or Use Helper Script

```bash
cd k8s/aws
./get-urls.sh
```

---

## 📊 Show Cluster Info

```bash
# Cluster information
kubectl cluster-info

# Show nodes
kubectl get nodes

# Show all resources in namespace
kubectl get all -n dev-env
```

---

## 🎬 Demo Flow

### Step 1: While Docker is Starting (Show Kubernetes Alternative)

```bash
# Terminal 1: Show pods
kubectl get pods -n dev-env -w

# Terminal 2: Port-forward backend
kubectl port-forward service/backend-service 3003:3003 -n dev-env

# Terminal 3: Port-forward dashboard
kubectl port-forward service/dashboard-frontend-service 3001:3000 -n dev-env
```

**Say**: *"While Docker is starting locally, I can also show you the same services running on AWS Kubernetes. Here are the pods, and I can access them via port-forwarding."*

### Step 2: After Docker Completes

```bash
# Stop all port-forwarding
pkill -f "kubectl port-forward"
```

**Say**: *"Now that local Docker is ready, let me stop the port-forwarding and show you the AWS environment."*

### Step 3: Show AWS Environment

```bash
# Show services with public URLs
kubectl get svc -n dev-env

# Get public URLs
cd k8s/aws && ./get-urls.sh
```

**Say**: *"On AWS, these services are publicly accessible via LoadBalancers. Here are the public URLs that anyone can access."*

---

## 💡 Quick Tips

- **Keep it brief**: Don't spend too much time on Kubernetes during main demo
- **Focus on local**: The main story is `make dev` working locally
- **AWS is optional**: Only show if asked or if you have extra time
- **Use helper script**: `./get-urls.sh` is faster than manual commands

---

## 🚨 If Something Goes Wrong

```bash
# Check pod logs
kubectl logs <pod-name> -n dev-env

# Describe pod (see why it's not running)
kubectl describe pod <pod-name> -n dev-env

# Restart a deployment
kubectl rollout restart deployment/<deployment-name> -n dev-env
```

