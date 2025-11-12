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

### The Solution (2 minutes)

> **"Watch this. A new developer clones the repo..."**

```bash
git clone <repo-url>
cd zero-to-running
make dev
```

> **"That's it. One command. In 30 seconds:"**

*[Point to each]*

> **"PostgreSQL—running. Redis—ready. Backend API—operational. Dashboard—showing everything. Application frontend—ready to code."**

*[Open dashboard at http://localhost:3001]*

> **"They can see everything working. Service status, health checks, logs, resources. All in one place. No configuration. No manual setup."**

> **"No AWS setup. No Kubernetes. No port-forwarding. Just one command, and everything works locally."**

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
- [ ] Show `make dev` (KEY moment - let it run)
- [ ] Open dashboard at `http://localhost:3001`
- [ ] Show services working
- [ ] **DO NOT show AWS/Kubernetes**

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
5. **Stay focused** - Local only, no AWS/Kubernetes

---

## 🎤 Quick Q&A

**Q: What about production?**  
A: Kubernetes support exists, but the core value is local development. One command, everything works.

**Q: Do I need AWS?**  
A: No! Everything runs locally with Docker. No cloud accounts needed.

**Q: Can I customize it?**  
A: Yes. Sensible defaults, but everything is configurable.

---

**Remember**: Keep it simple. One command. That's the story.
