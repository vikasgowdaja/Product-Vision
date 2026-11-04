# MVP Roadmap — 4 Weeks

> Goal: Ship a working end-to-end infographic generation and LinkedIn scheduling flow.

---

## Week 1 — Core Agent Foundation

**Theme:** Make the AI pipeline work end-to-end in a CLI/script before building the API.

### Tasks
- [ ] Set up Turborepo monorepo structure
- [ ] Configure PostgreSQL + TypeORM entities
- [ ] Configure Redis + BullMQ
- [ ] Implement **Trend Research Agent** (HN + Reddit + GitHub APIs)
- [ ] Implement **Content Writer Agent** (GPT-4o)
- [ ] Unit tests for both agents with mocked API responses
- [ ] CLI script: `node run-pipeline.ts --niche "AI Agents"`

### Deliverable
Running `node run-pipeline.ts` produces a structured JSON with topic, hook, and infographic body.

---

## Week 2 — Infographic Generation + Visual Export

**Theme:** Turn text content into a real PNG infographic.

### Tasks
- [ ] Implement **Content Strategist Agent**
- [ ] Implement **Infographic Designer Agent**
  - SVG template system (2–3 layouts)
  - Puppeteer or `sharp` for SVG → PNG export
  - AWS S3 upload
- [ ] Implement **Quality Verifier Agent** (Claude 3.5 Sonnet)
- [ ] NestJS API: `POST /infographics` endpoint
- [ ] BullMQ worker: `agent-pipeline` queue
- [ ] Basic Next.js page showing generated infographic

### Deliverable
API call produces a real PNG infographic accessible via S3 URL.

---

## Week 3 — LinkedIn Integration + Scheduling

**Theme:** Connect to LinkedIn and allow users to schedule posts.

### Tasks
- [ ] LinkedIn OAuth 2.0 flow (login + token storage)
- [ ] Implement **LinkedIn Publisher Agent**
  - LinkedIn UGC Posts API (v2)
  - Image upload to LinkedIn media API
- [ ] NestJS: `PATCH /infographics/:id/schedule` endpoint
- [ ] BullMQ delayed job for scheduled publishing
- [ ] Frontend: scheduling calendar / date-time picker
- [ ] Frontend: real-time pipeline progress via SSE

### Deliverable
Users can generate an infographic and schedule it to publish to LinkedIn at a chosen time.

---

## Week 4 — Multi-Agent Orchestration + Analytics Dashboard

**Theme:** Polish the full product and add creator-facing analytics.

### Tasks
- [ ] Agent retry logic (automatic retry on LLM errors)
- [ ] Agent trace viewer (full JSONB pipeline output in UI)
- [ ] PostHog integration (track generations, publishes, failures)
- [ ] Analytics dashboard: impressions, scheduled posts, usage meter
- [ ] Usage limits enforcement (Free: 5, Pro: 100/month)
- [ ] Stripe integration for Pro plan
- [ ] Niche-specific SVG templates (at least 3 designs)
- [ ] End-to-end tests

### Deliverable
Complete SaaS product: users can sign up, select a niche, generate infographics, and schedule LinkedIn posts. Free and Pro tiers work.

---

## Post-MVP Backlog

- [ ] Team workspaces (Enterprise)
- [ ] Approval workflows (manager approves before publishing)
- [ ] Multi-account LinkedIn publishing
- [ ] Custom brand kit (colors, fonts, logo)
- [ ] Auto-daily generation (cron: generate every morning at 7am per user)
- [ ] Content calendar view
- [ ] Performance analytics per post (LinkedIn impressions API)
- [ ] Canva-style drag-and-drop editor for the infographic
- [ ] Export to PDF / Newsletter
