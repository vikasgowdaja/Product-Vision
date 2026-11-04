# Agent Design Reference

## Design Principles

1. **Each agent has one responsibility** — no agent both researches and writes
2. **Agents are stateless** — all state lives in PostgreSQL (`agentTrace` JSONB)
3. **Different models for generation vs. verification** — GPT-4o writes, Claude verifies
4. **Every agent output is typed** — TypeScript interfaces enforce contracts
5. **Failures are isolated** — one agent failure does not cascade without retry logic

---

## Agent 1: Trend Research Agent

**Input:** `{ niche: string, topic?: string }`
**Output:** `TrendResult`

```typescript
interface TrendResult {
  topic: string;
  importance: number;  // 1–10
  audience: string;
  sources: string[];
  summary: string;
}
```

**Data sources (in priority order):**
1. Hacker News Algolia API
2. GitHub Search API (sorted by stars, recent)
3. Reddit hot posts (niche-specific subreddit)
4. Static seed topics (fallback if APIs fail)

**LLM role:** Rank and select the single best topic from 15–30 fetched signals.

---

## Agent 2: Content Strategist

**Input:** `TrendResult`
**Output:** `StrategyResult`

```typescript
interface StrategyResult {
  hook: string;
  linkedinAngle: string;
  targetAudience: string;
  keyTakeaways: string[];
  contentFormat: 'comparison' | 'steps' | 'tips' | 'deep-dive' | 'case-study';
}
```

**Prompt strategy:**
- Few-shot examples of high-performing LinkedIn hooks
- Format-specific guidelines (comparison → two columns, steps → numbered list)

---

## Agent 3: Content Writer

**Input:** `{ trendResult, strategyResult }`
**Output:** `ContentResult`

```typescript
interface ContentResult {
  title: string;
  body: string;     // structured infographic text
  caption: string;  // LinkedIn post (150–200 words)
  cta: string;
}
```

**Body format rules:**
- Max 120 words
- Emoji section headers
- ✓ checkmark bullets
- Mobile-readable (short lines)

---

## Agent 4: Infographic Designer

**Input:** `ContentResult`
**Output:** `DesignResult`

```typescript
interface DesignResult {
  svg: string;      // raw SVG source
  imageUrl: string; // S3 PNG URL
  layout: string;
}
```

**Layout templates:**
| Template | Use case |
|---|---|
| `split-comparison` | A vs B (Single Agent vs Multi-Agent) |
| `numbered-steps` | How-to, processes |
| `tips-grid` | Top N tips |
| `deep-dive` | Single concept breakdown |

**Export pipeline:**
```
SVG template → inject content → Puppeteer headless render → PNG → S3
```

---

## Agent 5: Quality Verifier

**Input:** `{ content: ContentResult, design: DesignResult }`
**Output:** `VerifyResult`

```typescript
interface VerifyResult {
  passed: boolean;
  score: number;    // 0–100
  issues: string[];
  suggestions: string[];
}
```

**Passes if:** score ≥ 60 and no critical issues
**Critical issues:** factual errors, broken SVG, harmful content
**Model:** Claude 3.5 Sonnet (independent from generation chain)

---

## Agent 6: LinkedIn Publisher

**Input:** `{ content: ContentResult, imageUrl: string }`
**Output:** `PublishResult`

```typescript
interface PublishResult {
  caption: string;
  hashtags: string[];       // max 5
  linkedinPostBody: string; // formatted for LinkedIn
}
```

**LinkedIn API flow (at publish time):**
1. `POST /v2/assets?action=registerUpload` → get upload URL
2. Upload PNG to upload URL
3. `POST /v2/ugcPosts` with asset URN + post body
4. Store returned `linkedinPostId` in DB

---

## Error Handling & Retries

```
Agent failure
    ├── LLM timeout / rate limit → BullMQ retry (exponential backoff, 3x)
    ├── LLM content filter → log + mark failed, notify user
    ├── S3 upload failure → retry 2x, then mark failed
    └── LinkedIn API error → log + mark failed, allow manual retry
```

All errors are stored in `infographic.agentTrace.error` for debugging.
