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
kubectl port-forward service/dashboard-frontend-service 3001:3001 -n dev-env

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

## 🎬 Demo Flow (Updated for Demo Script)

### Step 1: Start Docker Setup

```bash
# Terminal 1: Start local Docker
cd zero-to-running
make dev
```

*[Let this run in background - it takes 30-60 seconds]*

### Step 2: While Docker is Starting (Show AWS Environment)

**Say**: *"While Docker is starting locally, let me show you the same applications running on AWS Kubernetes. They're publicly accessible right now."*

```bash
# Terminal 2: Show running pods
kubectl get pods -n dev-env

# Terminal 2: Get public URLs
cd k8s/aws && ./get-urls.sh
```

*[Open browser, show public URLs working]*

**Say**: *"These are live, publicly accessible applications. Anyone can access them from anywhere. I can also access them locally via port-forwarding while Docker is starting."*

```bash
# Terminal 3: Port-forward backend (optional - quick demo)
kubectl port-forward service/backend-service 3003:3003 -n dev-env &

# Terminal 4: Port-forward dashboard (optional - quick demo)
kubectl port-forward service/dashboard-frontend-service 3001:3001 -n dev-env &

# Terminal 5: Port-forward app frontend (optional - quick demo)
kubectl port-forward service/app-frontend-service 3000:3000 -n dev-env &
```

*[Quickly show localhost:3001 working via port-forward - optional]*

### Step 3: Docker is Ready - Stop Port-Forwarding

**Say**: *"But here's the thing—we don't need AWS or port-forwarding for local development. Let me stop these and show you what just finished."*

```bash
# Stop all port-forwarding
pkill -f "kubectl port-forward"
```

### Step 4: Show Local Docker Environment

**Say**: *"That's it. One command. In 30 seconds, everything is running locally."*

*[Check Docker status - show services running]*

```bash
# Check Docker services
docker-compose ps
```

*[Open dashboard at http://localhost:3001]*

**Say**: *"They can see everything working. Service status, health checks, logs, resources. All in one place. No configuration. No manual setup. No AWS needed for local development."*

---

## 💡 Quick Tips

- **Timing is key**: Show AWS while Docker is starting (30-60 seconds)
- **Keep AWS brief**: Just enough to show it exists, then switch to local
- **Focus on local**: The main story is `make dev` working locally
- **Use helper script**: `./get-urls.sh` is faster than manual commands
- **Port-forwarding is optional**: Only show if you have time, otherwise skip to stopping it

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

