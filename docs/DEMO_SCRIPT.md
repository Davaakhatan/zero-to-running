# Demo Script: Zero-to-Running Developer Environment

**Duration**: 5-7 minutes  
**Goal**: Show how one command solves developer onboarding problems

---

## 📝 Script

### Opening (30 seconds)

> **"Hi, I'm Dave. When I was a senior engineer in Mongolia, I loved mentoring junior developers. But I spent 10 hours per new hire just setting up their development environment. That's why I built this."**

---

### The Problem (1 minute)

> **"A new developer joins. They're excited, ready to code. But then: PostgreSQL setup (2 hours). Redis configuration (1 hour). Backend API (3 hours). Environment variables (1 hour). Debugging (3 hours). That's 10 hours before they can write a single line of code."**

> **"And even after all that, we still had 'works on my machine' problems. Different versions, different configurations. It was a nightmare."**

---

### The Solution (3 minutes)

> **"Watch this. A new developer clones the repo..."**

```bash
git clone <repo-url>
cd zero-to-running
make dev
```

*[Start `make dev` - let it run in background/terminal]*

> **"While Docker is starting locally, let me show you something else. The same applications are also running on AWS Kubernetes, and they're publicly accessible right now."**

*[Open new terminal - show AWS environment]*

```bash
# Show running pods on AWS
kubectl get pods -n dev-env

# Get public URLs
cd k8s/aws && ./get-urls.sh
```

*[Open browser, show public URLs working - Dashboard, CollabCanva, App Frontend]*

> **"These are live, publicly accessible applications running on AWS. Anyone can access them from anywhere. And I can also access them locally via port-forwarding while Docker is starting."**

*[Show port-forwarding commands in separate terminals]*

```bash
# Terminal 1: Backend API
kubectl port-forward service/backend-service 3003:3003 -n dev-env

# Terminal 2: Dashboard
kubectl port-forward service/dashboard-frontend-service 3001:3001 -n dev-env

# Terminal 3: App Frontend
kubectl port-forward service/app-frontend-service 3000:3000 -n dev-env
```

*[Quickly show localhost:3001 working via port-forward]*

> **"But here's the thing—we don't need AWS or port-forwarding for local development. Let me stop these and show you what just finished."**

*[Stop port-forwarding]*

```bash
pkill -f "kubectl port-forward"
```

*[Check Docker status - should be ready]*

> **"That's it. One command. In 30 seconds:"**

*[Point to each service in local Docker]*

> **"PostgreSQL—running. Redis—ready. Backend API—operational. Dashboard—showing everything. Application frontend—ready to code."**

*[Open dashboard at http://localhost:3001]*

> **"They can see everything working. Service status, health checks, logs, resources. All in one place. No configuration. No manual setup."**

> **"No AWS setup needed. No Kubernetes configuration. No port-forwarding. Just one command, and everything works locally."**

---

### Real-World Impact (1.5 minutes)

> **"Before: Day 1—Environment setup (8 hours). Day 2—Debugging (6 hours). Day 3—Finally coding (2 hours). That's 14 hours before they contribute."**

> **"With this: Day 1, Hour 1—Clone and run `make dev` (5 minutes). Rest of the day—Writing code, being productive. They're contributing on day one."**

> **"For me: Before—10 hours per new hire on setup. With this—5 minutes to verify. I can focus on mentoring, code reviews, architecture—the things that actually help them grow."**

> **"The culture I loved in Mongolia—being a buddy to new engineers—that's still possible. But now, instead of configuration, we talk about code quality and best practices."**

---

### Why Wander? (30 seconds)

> **"Wander is about making journeys easier. This project makes the journey from 'new developer' to 'productive team member' easier. It removes barriers so they can focus on building great software."**

---

### Closing (30 seconds)

> **"One command. Full environment. Zero configuration. That's the promise. And that's what makes the difference between a frustrating first week and a productive first day."**

> **"Thank you. Questions?"**

---

## 🎯 Key Points

- **Problem**: 10 hours per engineer on manual setup
- **Solution**: One command (`make dev`), 5 minutes
- **Impact**: Developers productive on day one
- **Personal**: Your story about mentoring in Mongolia
- **Vision**: Every developer productive in 5 minutes

---

## 🎬 Demo Checklist

### Before
- [ ] Docker Desktop running
- [ ] All services stopped (`make down`)
- [ ] No port-forwarding running
- [ ] Terminal ready
- [ ] Browser ready

### During
- [ ] Show `git clone`
- [ ] Start `make dev` (let it run in background)
- [ ] **While Docker is starting**: Show AWS environment
  - [ ] Run `kubectl get pods -n dev-env`
  - [ ] Run `cd k8s/aws && ./get-urls.sh`
  - [ ] Open public URLs in browser (show they work)
  - [ ] Show port-forwarding commands (optional - quick demo)
- [ ] **Once Docker is ready**: Stop port-forwarding
  - [ ] Run `pkill -f "kubectl port-forward"`
- [ ] Show local Docker services working
- [ ] Open dashboard at `http://localhost:3001`
- [ ] Show services working locally

### After
- [ ] Q&A ready
- [ ] Know technical details
- [ ] Be ready to discuss adding services

---

## 💡 Tips

1. **Start with story** - Personal connection
2. **Show, don't tell** - Let them see `make dev` work
3. **Use numbers** - "10 hours vs 5 minutes"
4. **Pause for impact** - Let key points sink in
5. **Use AWS as transition** - Show AWS while Docker starts, then switch to local
6. **Keep AWS brief** - Just enough to show it exists, then focus on local

---

## 🎤 Quick Q&A

**Q: What about production?**  
A: The same applications you saw on AWS are also available for production deployment. But the core value is local development—one command, everything works locally.

**Q: Do I need AWS for local development?**  
A: No! Everything runs locally with Docker. AWS is optional for production deployment. For local development, you just need Docker Desktop.

**Q: Can I customize it?**  
A: Yes. Sensible defaults, but everything is configurable.

---

**Remember**: Keep it simple. One command. That's the story.
