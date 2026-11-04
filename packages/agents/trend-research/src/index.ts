import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface TrendResult {
  topic: string;
  importance: number; // 1–10
  audience: string;
  sources: string[];
  summary: string;
}

interface TrendInput {
  niche: string;
  topic?: string; // if provided, skip discovery
}

/**
 * Agent 1 — Trend Research Agent
 *
 * Monitors GitHub Trending, Hacker News, Reddit (r/programming, r/MachineLearning),
 * and major engineering blogs to identify the most relevant topic for a given niche.
 * If a topic is manually provided, it enriches it with context instead.
 */
@Injectable()
export class TrendResearchAgent {
  constructor(private readonly config: ConfigService) {}

  async run(input: TrendInput): Promise<TrendResult> {
    if (input.topic) {
      return this.enrichTopic(input.niche, input.topic);
    }
    return this.discoverTopic(input.niche);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async discoverTopic(niche: string): Promise<TrendResult> {
    const sources = await Promise.allSettled([
      this.fetchHackerNews(niche),
      this.fetchGitHubTrending(niche),
      this.fetchReddit(niche),
    ]);

    const items = sources
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => (r as PromiseFulfilledResult<string[]>).value);

    // Use LLM to rank and select the best topic
    return this.rankWithLLM(niche, items);
  }

  private async enrichTopic(niche: string, topic: string): Promise<TrendResult> {
    // Fetch supporting context for a manually provided topic
    const context = await this.fetchHackerNews(niche).catch(() => []);
    return {
      topic,
      importance: 8,
      audience: this.audienceForNiche(niche),
      sources: context.slice(0, 3),
      summary: `Manually provided topic: "${topic}" in the ${niche} niche.`,
    };
  }

  private async fetchHackerNews(niche: string): Promise<string[]> {
    const res = await axios.get<{ hits: { title: string }[] }>(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(niche)}&tags=story&hitsPerPage=10`,
    );
    return res.data.hits.map((h) => h.title);
  }

  private async fetchGitHubTrending(niche: string): Promise<string[]> {
    // GitHub doesn't have an official trending API; scrape or use third-party
    const res = await axios.get<{ items: { full_name: string; description: string }[] }>(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(niche)}&sort=stars&order=desc&per_page=5`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );
    return res.data.items.map((r) => `${r.full_name}: ${r.description ?? ''}`);
  }

  private async fetchReddit(niche: string): Promise<string[]> {
    const sub = this.subredditForNiche(niche);
    const res = await axios.get<{ data: { children: { data: { title: string } }[] } }>(
      `https://www.reddit.com/r/${sub}/hot.json?limit=10`,
      { headers: { 'User-Agent': 'InfographAI/1.0' } },
    );
    return res.data.data.children.map((c) => c.data.title);
  }

  private async rankWithLLM(niche: string, items: string[]): Promise<TrendResult> {
    // Placeholder — real implementation calls OpenAI to rank and pick best topic
    return {
      topic: items[0] ?? `${niche} best practices`,
      importance: 8,
      audience: this.audienceForNiche(niche),
      sources: items.slice(0, 3),
      summary: `Top trending topic in ${niche} based on ${items.length} signals.`,
    };
  }

  private subredditForNiche(niche: string): string {
    const map: Record<string, string> = {
      'AI Agents': 'MachineLearning',
      'System Design': 'programming',
      'Salesforce': 'salesforce',
      'DevOps': 'devops',
      'Cloud (AWS/Azure)': 'aws',
    };
    return map[niche] ?? 'programming';
  }

  private audienceForNiche(niche: string): string {
    const map: Record<string, string> = {
      'AI Agents': 'AI/ML Engineers and Architects',
      'System Design': 'Senior Software Engineers',
      'Salesforce': 'Salesforce Developers and Admins',
      'DevOps': 'Platform and Site Reliability Engineers',
      'Career Growth': 'Mid-to-Senior Software Engineers',
    };
    return map[niche] ?? 'Software Engineers';
  }
}
