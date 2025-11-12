# Service Access Overview

## 🌐 Public Access (LoadBalancer - Accessible from Internet)

These services are publicly accessible via AWS LoadBalancer:

### ✅ Dashboard Frontend
- **URL**: `http://a25328365da404a76b0dbd435dc9fb92-215160859.us-east-1.elb.amazonaws.com:3000`
- **Status**: Publicly accessible
- **Connects to**: Backend API (via LoadBalancer URL)

### ✅ CollabCanva
- **URL**: `http://aced1a3814886479d8c3e47097b8a097-1410118245.us-east-1.elb.amazonaws.com:3002`
- **Status**: Publicly accessible
- **Connects to**: Backend API (via LoadBalancer URL)

### ✅ Backend API
- **URL**: `http://a137fbf5d151c45c685e1a7ec9e59669-554925402.us-east-1.elb.amazonaws.com:3003`
- **Status**: Publicly accessible
- **Connects to**: 
  - Database (PostgreSQL) - Internal only
  - Redis (Cache) - Internal only

---

## 🔒 Internal Access Only (ClusterIP - Within Kubernetes Cluster)

These services are **NOT** publicly accessible (by design for security):

### 🔐 Database (PostgreSQL)
- **Service Name**: `postgres-service:5432`
- **Status**: Internal only (ClusterIP)
- **Why**: Database should never be exposed publicly for security
- **Accessible by**: Backend API only (within cluster)

### 🔐 Redis (Cache)
- **Service Name**: `redis-service:6379`
- **Status**: Internal only (ClusterIP)
- **Why**: Cache should never be exposed publicly for security
- **Accessible by**: Backend API only (within cluster)

### ✅ App Frontend (Quote App)
- **URL**: `http://ac297bbc9cf094dc39494f5f50862e01-732484123.us-east-1.elb.amazonaws.com:3000`
- **Status**: Publicly accessible
- **Connects to**: Backend API (via LoadBalancer URL)

---

## 🔗 Service Connectivity

### How Services Connect:

1. **Frontend → Backend API**
   - Dashboard: Uses backend LoadBalancer URL (public)
   - CollabCanva: Uses backend LoadBalancer URL (public)
   - App Frontend: Uses `backend-service:3003` (internal)

2. **Backend API → Database**
   - Uses `postgres-service:5432` (internal Kubernetes service name)
   - Connection string: `postgresql://devuser:devpass@postgres-service:5432/devenv`

3. **Backend API → Redis**
   - Uses `redis-service:6379` (internal Kubernetes service name)
   - Connection string: `redis://redis-service:6379`

4. **All Services → Each Other**
   - Within Kubernetes cluster: ✅ Yes, using service names
   - From Internet: ❌ Only LoadBalancer services

---

## 📊 Current Service Status

| Service | Type | Public Access | Internal Access | Connects To |
|---------|------|---------------|------------------|-------------|
| Dashboard | LoadBalancer | ✅ Yes | ✅ Yes | Backend API |
| CollabCanva | LoadBalancer | ✅ Yes | ✅ Yes | Backend API |
| Backend API | LoadBalancer | ✅ Yes | ✅ Yes | Database, Redis |
| App Frontend | LoadBalancer | ✅ Yes | ✅ Yes | Backend API |
| Database | ClusterIP | ❌ No | ✅ Yes | None (receives connections) |
| Redis | ClusterIP | ❌ No | ✅ Yes | None (receives connections) |

---

## 🚀 To Expose App Frontend Publicly

If you want to expose `app-frontend` publicly:

```bash
kubectl patch svc app-frontend-service -n dev-env -p '{"spec":{"type":"LoadBalancer"}}'
```

Then get the URL:
```bash
kubectl get svc app-frontend-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

---

## 🔒 Security Best Practices

**✅ Correct Setup:**
- Database and Redis are **internal only** (secure)
- Frontends and API are public (as needed)
- Backend connects to database/redis internally

**⚠️ Important:**
- Never expose database or Redis publicly
- Use authentication/authorization for public APIs
- Consider adding HTTPS/TLS for production

---

## 📝 Summary

**All services CAN access each other:**
- ✅ Within Kubernetes cluster (using service names)
- ✅ Public services can call backend API (via LoadBalancer)

**Publicly accessible:**
- ✅ Dashboard
- ✅ CollabCanva
- ✅ App Frontend (Quote App)
- ✅ Backend API

**Internal only (by design):**
- 🔐 Database (PostgreSQL)
- 🔐 Redis (Cache)

