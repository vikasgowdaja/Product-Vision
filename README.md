# InfographAI — Daily LinkedIn Infographic Generation Platform

> **"ByteByteGo for AI-generated technical content"**

An AI-powered SaaS platform that automatically researches trends, creates professional LinkedIn-ready infographics, and schedules daily publishing — for individual creators and engineering organizations.

---

## What It Does

Users select a niche (AI Agents, Salesforce, System Design, Cloud) and every morning the platform:

1. **Researches** trending topics from GitHub, Hacker News, Reddit, and engineering blogs
2. **Strategizes** a compelling LinkedIn angle and hook
3. **Writes** structured infographic content and captions
4. **Designs** a polished visual (SVG/PNG/Canva-style)
5. **Verifies** grammar, technical accuracy, and brand consistency
6. **Publishes** to LinkedIn with hashtags and scheduling

---

## Supported Niches

| Category | Examples |
|---|---|
| AI & Agents | LangGraph, CrewAI, OpenAI Agents SDK |
| System Design | Distributed systems, CAP theorem, databases |
| Software Architecture | Microservices, event-driven, DDD |
| Salesforce | Flow, Apex, Data Cloud, AgentForce |
| Cloud | AWS, Azure, GCP announcements |
| Full Stack Dev | React, Next.js, Node.js patterns |
| DevOps | CI/CD, Kubernetes, GitOps |
| Career Growth | Promotions, interviews, salary negotiation |
| Tech Leadership | Engineering management, OKRs, roadmaps |

---

## Architecture

This platform is built on a **6-agent orchestration pipeline**:

```
Trend Research → Content Strategist → Content Writer
                                            ↓
LinkedIn Publisher ← Quality Verifier ← Infographic Designer
```

See [docs/architecture.md](docs/architecture.md) for the full system design.

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS** + **ShadCN/UI**
- **Framer Motion** (animations)

### Backend
- **NestJS** (Node.js)
- **PostgreSQL** (primary database)
- **Redis + BullMQ** (job queues)
- **AWS S3** (infographic storage)

### AI / Agent Layer
- **LangGraph** (agent orchestration)
- **OpenAI GPT-4o** (content generation)
- **Anthropic Claude** (quality verification)
- **Gemini** (fallback / multi-model)

### Infrastructure
- **Podman** + **Podman Compose**
- **GitHub Actions** (CI/CD)
- **PostHog** (analytics)

---

## Revenue Model

| Tier | Price | Infographics | Features |
|---|---|---|---|
| Free | ₹0/mo | 5/month | Basic templates |
| Pro | ₹999/mo | 100/month | LinkedIn scheduling, brand templates |
| Enterprise | ₹9,999+/mo | Unlimited | Team workspaces, approval workflows, multi-account |

---

## MVP Roadmap (4 Weeks)

| Week | Deliverable |
|---|---|
| Week 1 | Trend Research Agent + Content Writer Agent |
| Week 2 | Infographic Generator + SVG Export |
| Week 3 | LinkedIn Caption Generator + Post Scheduler |
| Week 4 | Multi-Agent Orchestration + Analytics Dashboard |

See [docs/roadmap.md](docs/roadmap.md) for detailed sprint breakdowns.

---

## Project Structure

```
infograph-ai/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api/                    # NestJS backend
├── packages/
│   ├── agents/                 # Multi-agent system
│   │   ├── trend-research/
│   │   ├── content-strategist/
│   │   ├── content-writer/
│   │   ├── infographic-designer/
│   │   ├── quality-verifier/
│   │   └── linkedin-publisher/
│   └── shared/                 # Shared types, DTOs, utils
├── infrastructure/
│   ├── podman/
│   └── github-actions/
└── docs/
```

---

## Getting Started

```bash
# Clone and install
git clone https://github.com/your-org/infograph-ai
cd infograph-ai
npm install

# Configure environment
cp .env.example .env
# Fill in API keys: OPENAI_API_KEY, ANTHROPIC_API_KEY, LINKEDIN_CLIENT_ID, etc.

# Start local services
podman compose up -d

# Run development servers
npm run dev
```

---

## Competitive Positioning

| Platform | Content Type | Generation | Publishing |
|---|---|---|---|
| ByteByteGo | System design | Manual | Newsletter |
| Levels.fyi | Career data | Manual | Web |
| **InfographAI** | **Any tech niche** | **AI-automated** | **LinkedIn auto-publish** |

---

## License

MIT
