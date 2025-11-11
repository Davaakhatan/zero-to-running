# AWS Deployment Best Practices Guide

## 🏗️ Architecture Overview

### Recommended AWS Services Stack

```
┌─────────────────────────────────────────────────────────┐
│                    CloudFront CDN                        │
│              (Static assets, caching)                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Application Load Balancer                   │
│         (HTTPS termination, routing)                    │
└──────────┬──────────────────────────────┬───────────────┘
           │                              │
    ┌──────▼──────┐              ┌───────▼──────┐
    │  ECS Fargate │              │  ECS Fargate │
    │   Frontend   │              │   Backend    │
    │  (2+ tasks)  │              │  (2+ tasks)  │
    └──────────────┘              └───────┬──────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
            ┌───────▼──────┐    ┌────────▼────────┐  ┌────────▼────────┐
            │   RDS         │    │  ElastiCache    │  │  Secrets        │
            │  PostgreSQL   │    │     Redis       │  │  Manager        │
            │ (Multi-AZ)    │    │  (Multi-AZ)     │  │                 │
            └───────────────┘    └─────────────────┘  └─────────────────┘
```

## 🔒 Security Best Practices

### 1. Network Security

**VPC Architecture:**
- **Public Subnets**: ALB only (2+ AZs)
- **Private Subnets**: ECS tasks, RDS, ElastiCache (2+ AZs)
- **NAT Gateway**: For outbound internet from private subnets
- **No direct internet access** for application containers

**Security Groups:**
```bash
# ALB Security Group
- Inbound: 80, 443 from 0.0.0.0/0
- Outbound: All traffic

# Backend Security Group
- Inbound: 3003 from ALB security group only
- Outbound: RDS (5432), Redis (6379), Secrets Manager

# Frontend Security Group
- Inbound: 3000 from ALB security group only
- Outbound: Backend (3003), Secrets Manager

# RDS Security Group
- Inbound: 5432 from Backend security group only
- Outbound: None

# Redis Security Group
- Inbound: 6379 from Backend security group only
- Outbound: None
```

### 2. Secrets Management

**Use AWS Secrets Manager (NOT environment variables):**
```json
{
  "secrets": [
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:app/database-url"
    },
    {
      "name": "REDIS_URL",
      "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:app/redis-url"
    },
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:app/jwt-secret"
    }
  ]
}
```

**Rotate secrets regularly:**
- Enable automatic rotation for RDS credentials
- Rotate application secrets every 90 days
- Use separate secrets per environment

### 3. IAM Roles & Policies

**Principle of Least Privilege:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:*:*:secret:app/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/ecs/*"
    }
  ]
}
```

### 4. Encryption

- **At Rest**: Enable encryption for RDS, ElastiCache, EBS volumes
- **In Transit**: TLS 1.2+ for all connections
- **Secrets**: Encrypted in Secrets Manager (AWS KMS)

## 📊 High Availability & Scalability

### 1. Multi-AZ Deployment

**All services in 2+ Availability Zones:**
- ECS tasks: Spread across AZs
- RDS: Multi-AZ deployment
- ElastiCache: Multi-AZ with automatic failover
- ALB: Cross-AZ load balancing

### 2. Auto Scaling

**ECS Service Auto Scaling:**
```json
{
  "minCapacity": 2,
  "maxCapacity": 10,
  "targetTrackingScalingPolicies": [
    {
      "targetValue": 70.0,
      "predefinedMetricSpecification": {
        "predefinedMetricType": "ECSServiceAverageCPUUtilization"
      }
    },
    {
      "targetValue": 80.0,
      "predefinedMetricSpecification": {
        "predefinedMetricType": "ECSServiceAverageMemoryUtilization"
      }
    }
  ]
}
```

**ALB Target Group Health Checks:**
- Healthy threshold: 2
- Unhealthy threshold: 3
- Interval: 30 seconds
- Timeout: 5 seconds
- Path: `/health` for backend, `/` for frontend

### 3. Database Connection Pooling

**Backend connection pool settings:**
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections per instance
  min: 5,  // Minimum idle connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Enable connection retry
  retry: {
    max: 3,
    match: [/ECONNREFUSED/, /ETIMEDOUT/],
  },
});
```

## 💰 Cost Optimization

### 1. Right-Sizing

**Start small, scale up:**
- RDS: `db.t3.micro` → `db.t3.small` → `db.t3.medium`
- ElastiCache: `cache.t3.micro` → `cache.t3.small`
- ECS: 0.5 vCPU, 1GB RAM → scale based on metrics

### 2. Reserved Instances

- **RDS**: 1-year reserved instances (40% savings)
- **ElastiCache**: Reserved nodes for predictable workloads

### 3. Spot Instances (Advanced)

- Use Spot instances for non-critical workloads
- Mix Spot and On-Demand for cost/availability balance

### 4. CloudWatch Cost Monitoring

- Set up billing alerts at 50%, 75%, 90% of budget
- Use Cost Explorer to identify optimization opportunities

## 📈 Monitoring & Observability

### 1. CloudWatch Metrics

**Key Metrics to Monitor:**
- **ECS**: CPUUtilization, MemoryUtilization, RunningTaskCount
- **RDS**: CPUUtilization, DatabaseConnections, FreeableMemory
- **ElastiCache**: CPUUtilization, NetworkBytesIn, NetworkBytesOut
- **ALB**: TargetResponseTime, HTTPCode_Target_2XX_Count, HTTPCode_Target_5XX_Count

### 2. CloudWatch Alarms

**Critical Alarms:**
```bash
# High CPU
aws cloudwatch put-metric-alarm \
  --alarm-name backend-high-cpu \
  --alarm-description "Backend CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Database connections
aws cloudwatch put-metric-alarm \
  --alarm-name rds-high-connections \
  --alarm-description "RDS connections > 80%" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### 3. Structured Logging

**Use JSON logs for CloudWatch:**
```typescript
fastify.log.info({
  requestId: request.id,
  method: request.method,
  url: request.url,
  statusCode: reply.statusCode,
  responseTime: reply.getResponseTime(),
  userId: request.user?.id,
}, 'Request completed');
```

### 4. Distributed Tracing

- Consider AWS X-Ray for request tracing
- Track requests across services
- Identify performance bottlenecks

## 🚀 CI/CD Best Practices

### 1. GitHub Actions / GitLab CI

**Pipeline Stages:**
1. **Lint & Test**: Run linters, type checks, unit tests
2. **Build**: Build Docker images
3. **Security Scan**: Scan images for vulnerabilities
4. **Push to ECR**: Tag and push images
5. **Deploy**: Update ECS services (blue/green deployment)

### 2. Blue/Green Deployments

**ECS Blue/Green Deployment:**
```bash
aws ecs create-deployment \
  --service backend-service \
  --cluster zero-to-running-cluster \
  --task-definition zero-to-running-backend:NEW_VERSION \
  --desired-count 2
```

### 3. Database Migrations

- Run migrations as separate ECS task before deployment
- Use migration tool (e.g., Prisma, TypeORM migrations)
- Test migrations on staging first
- Rollback plan for failed migrations

## 🔄 Disaster Recovery

### 1. Backups

**RDS Automated Backups:**
- Retention: 7-35 days
- Point-in-time recovery enabled
- Cross-region backup replication

**Application State:**
- Backup Redis snapshots
- Export critical data regularly
- Store backups in S3 with versioning

### 2. Multi-Region (Advanced)

- Deploy to 2+ regions for DR
- Use Route53 health checks for failover
- Replicate RDS across regions

## 📋 Production Checklist

### Pre-Deployment
- [ ] All secrets in AWS Secrets Manager
- [ ] Security groups configured correctly
- [ ] SSL certificates in ACM
- [ ] Health checks configured
- [ ] Auto-scaling policies set
- [ ] CloudWatch alarms configured
- [ ] Backup strategy in place
- [ ] Monitoring dashboards created

### Post-Deployment
- [ ] Verify all services healthy
- [ ] Test health endpoints
- [ ] Verify CORS configuration
- [ ] Test database connectivity
- [ ] Test Redis connectivity
- [ ] Verify logs in CloudWatch
- [ ] Load test application
- [ ] Verify auto-scaling works

## 🛠️ Infrastructure as Code

**Use Terraform or AWS CDK:**
- Version control infrastructure
- Reproducible deployments
- Environment parity (dev/staging/prod)
- Easy rollback capabilities

## 📚 Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [Security Best Practices](https://aws.amazon.com/security/security-resources/)

