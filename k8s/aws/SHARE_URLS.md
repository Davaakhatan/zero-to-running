# Share Your Applications - Public URLs

## 🌐 Public Access URLs

Your applications are now publicly accessible! Share these URLs with anyone:

### 📊 Dashboard Frontend
```
http://a25328365da404a76b0dbd435dc9fb92-215160859.us-east-1.elb.amazonaws.com:3000
```

### 🎨 CollabCanva
```
http://aced1a3814886479d8c3e47097b8a097-1410118245.us-east-1.elb.amazonaws.com:3002
```

## ⚠️ Important: Port Numbers Required

**Note**: These LoadBalancers expose the application ports directly (3000 and 3002), not port 80. You **must include the port number** in the URL.

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
2. **Port Numbers**: Always include `:3000` for Dashboard and `:3002` for CollabCanva
3. **HTTPS**: For production, consider adding TLS certificates and configuring port 443
4. **Custom Domain**: You can point a custom domain to these load balancers via DNS CNAME records
5. **Cost**: ~$16/month per LoadBalancer + data transfer

## 🔒 Security Note

These URLs are publicly accessible. For production use:
- Add authentication (OAuth, API keys, etc.)
- Enable HTTPS/TLS
- Consider using AWS WAF for additional protection
- Implement rate limiting

## 🔧 Troubleshooting

If URLs don't work:
1. Check security groups allow traffic on ports 3000 and 3002:
   ```bash
   ./fix-security-groups.sh
   ```
2. Verify pods are running:
   ```bash
   kubectl get pods -n dev-env
   ```
3. Check service status:
   ```bash
   kubectl get svc -n dev-env
   ```

## 📊 Monitoring

Check service status:
```bash
kubectl get svc -n dev-env
kubectl get pods -n dev-env
```
