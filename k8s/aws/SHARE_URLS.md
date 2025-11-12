# Share Your Applications - Public URLs

## 🌐 Public Access URLs

Your applications are now publicly accessible! Share these URLs with anyone:

### 📊 Dashboard Frontend
```
http://a25328365da404a76b0dbd435dc9fb92-215160859.us-east-1.elb.amazonaws.com
```

### 🎨 CollabCanva
```
http://aced1a3814886479d8c3e47097b8a097-1410118245.us-east-1.elb.amazonaws.com
```

## 📱 Quick Access

**To get these URLs anytime, run:**
```bash
cd k8s/aws
./get-urls.sh
```

Or manually:
```bash
kubectl get svc -n dev-env | grep -E "dashboard|collabcanva"
```

## 🔍 Service Details

- **Dashboard**: Port 3000 (exposed via LoadBalancer)
- **CollabCanva**: Port 3002 (exposed via LoadBalancer)
- **Type**: AWS Classic Load Balancer (ELB)
- **Region**: us-east-1
- **Status**: ✅ Active and publicly accessible

## 💡 Tips

1. **Bookmark these URLs** - They remain stable as long as the services are running
2. **HTTPS**: For production, consider adding TLS certificates
3. **Custom Domain**: You can point a custom domain to these load balancers via DNS CNAME records
4. **Cost**: ~$16/month per LoadBalancer + data transfer

## 🔒 Security Note

These URLs are publicly accessible. For production use:
- Add authentication (OAuth, API keys, etc.)
- Enable HTTPS/TLS
- Consider using AWS WAF for additional protection
- Implement rate limiting

## 📊 Monitoring

Check service status:
```bash
kubectl get svc -n dev-env
kubectl get pods -n dev-env
```

