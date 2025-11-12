# Demo Notes: What to Show and What to Skip

## ✅ What to Show (Main Demo)

### The Core Story: One Command Setup
1. **Local Docker Setup Only**
   - Show `make dev` running
   - Show services starting locally
   - Show dashboard at `http://localhost:3001`
   - Show all services working locally

2. **Key Message**
   - "One command. Everything works locally."
   - "No cloud setup needed."
   - "No Kubernetes configuration."
   - "No port-forwarding."

3. **Dashboard Features** (Local)
   - Service discovery (all services detected automatically)
   - Health checks (all green)
   - Logs (showing local Docker logs)
   - Resource usage (local containers)

## ❌ What NOT to Show (Unless Specifically Asked)

### Don't Show in Main Demo
1. **AWS/Kubernetes Setup**
   - Don't show `kubectl` commands
   - Don't show port-forwarding
   - Don't show LoadBalancer URLs
   - Don't show cloud configuration

2. **Why?**
   - It breaks the "one command" narrative
   - It adds complexity
   - It's not the core value proposition
   - It confuses the main message

### If Asked About Production

**Response Template:**
> "The project does support Kubernetes deployment to AWS, Azure, or GCP for production use. But that's a separate concern. The core value—and what solves the problem I described—is the local development experience. One command, everything works on your machine. Production deployment is optional and doesn't change the developer onboarding experience."

## 🎯 Demo Flow

### Opening
- Personal story about Mongolia
- The problem (10 hours per engineer)

### Main Demo (Focus Here)
1. Clone repository
2. Run `make dev`
3. Show services starting
4. Open dashboard
5. Show everything working
6. Emphasize: "One command. That's it."

### Closing
- Impact: Day 1 productivity
- Vision: Every developer productive in 5 minutes

## 📝 Quick Reference

**What to say:**
- "One command: `make dev`"
- "Everything runs locally"
- "No cloud setup needed"
- "5 minutes to productive"

**What NOT to say:**
- "You can also deploy to AWS..."
- "For production, you need Kubernetes..."
- "You can use port-forwarding..."
- "Here's how to set up AWS..."

**If asked about production:**
- Acknowledge it exists
- Redirect to local development value
- Keep focus on developer onboarding

## 🚨 Common Mistakes to Avoid

1. **Don't show AWS/Kubernetes unless asked**
   - It dilutes the main message
   - It makes it seem complex
   - It's not the core value

2. **Don't mention port-forwarding**
   - Not needed for local setup
   - Adds unnecessary complexity
   - Confuses the audience

3. **Don't show cloud configuration**
   - Breaks the "zero configuration" message
   - Makes it seem like setup is hard
   - Not relevant to the problem being solved

4. **Do keep it simple**
   - One command
   - Local only
   - Everything works
   - That's the story

## ✅ Pre-Demo Checklist

- [ ] All services stopped (`make down`)
- [ ] No port-forwarding running
- [ ] No kubectl connections active
- [ ] Docker Desktop running
- [ ] Terminal ready
- [ ] Browser ready (will open during demo)
- [ ] Repository cloned or ready to clone
- [ ] Know your talking points
- [ ] Practice the flow

## 🎤 During Demo

**Stay on message:**
- Local development
- One command
- Zero configuration
- Developer productivity

**If someone asks about production:**
- Acknowledge it exists
- Keep it brief
- Redirect to local value
- Don't demo it unless they really want to see it

**Remember:**
- The problem is local setup
- The solution is local setup
- The demo should show local setup
- Production is a different conversation

