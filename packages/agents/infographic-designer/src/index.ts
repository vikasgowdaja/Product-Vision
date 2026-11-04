import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ContentResult } from '../../content-writer/src';

export interface DesignResult {
  svg: string;       // raw SVG source
  imageUrl: string;  // S3 URL of exported PNG
  layout: string;    // layout type used
}

/**
 * Agent 4 — Infographic Designer
 *
 * Takes structured content and generates a LinkedIn-optimized infographic.
 *
 * Strategy:
 *  1. Generate SVG programmatically using a template system (fast, brand-consistent)
 *  2. Optionally use GPT-4o image generation for hero visuals
 *  3. Export PNG and upload to S3
 *
 * LinkedIn recommended image size: 1200×627px (landscape) or 1080×1080px (square).
 */
@Injectable()
export class InfographicDesignerAgent {
  private _openai: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  private get openai(): OpenAI {
    if (!this._openai) {
      this._openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
    }
    return this._openai;
  }

  async run(content: ContentResult): Promise<DesignResult> {
    const svg = this.generateSVG(content);
    // In production: render SVG → PNG with Puppeteer/sharp, upload to S3
    const imageUrl = await this.uploadToS3(svg);

    return { svg, imageUrl, layout: 'split-comparison' };
  }

  // ── SVG Template ──────────────────────────────────────────────────────────

  private generateSVG(content: ContentResult): string {
    const escaped = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <!-- Background -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e3a5f"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>

  <!-- Brand bar -->
  <rect x="0" y="0" width="8" height="1080" fill="#3b82f6"/>

  <!-- Title -->
  <text
    x="540" y="120"
    font-family="Inter, Arial, sans-serif"
    font-size="52"
    font-weight="700"
    fill="#ffffff"
    text-anchor="middle"
  >${escaped(content.title)}</text>

  <!-- Body content -->
  <foreignObject x="80" y="160" width="920" height="760">
    <body xmlns="http://www.w3.org/1999/xhtml"
          style="font-family:Inter,Arial,sans-serif;color:#e2e8f0;font-size:28px;line-height:1.6;white-space:pre-wrap;margin:0;">
      ${escaped(content.body)}
    </body>
  </foreignObject>

  <!-- CTA -->
  <rect x="80" y="960" width="920" height="70" rx="12" fill="#3b82f6" opacity="0.2"/>
  <text
    x="540" y="1002"
    font-family="Inter, Arial, sans-serif"
    font-size="26"
    fill="#93c5fd"
    text-anchor="middle"
  >${escaped(content.cta)}</text>

  <!-- Watermark -->
  <text
    x="1060" y="1070"
    font-family="Inter, Arial, sans-serif"
    font-size="18"
    fill="#475569"
    text-anchor="end"
  >InfographAI</text>
</svg>`;
  }

  private async uploadToS3(svg: string): Promise<string> {
    // TODO: implement S3 upload via @aws-sdk/client-s3
    // For now return a placeholder
    return `https://${this.config.get('AWS_S3_BUCKET')}.s3.amazonaws.com/infographics/placeholder.png`;
  }
}
