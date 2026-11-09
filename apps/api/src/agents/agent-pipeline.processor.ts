import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Infographic } from '../infographics/entities/infographic.entity';
import { TrendResearchAgent } from '../../../../packages/agents/trend-research/src';
import { ContentStrategistAgent } from '../../../../packages/agents/content-strategist/src';
import { ContentWriterAgent } from '../../../../packages/agents/content-writer/src';
import { InfographicDesignerAgent } from '../../../../packages/agents/infographic-designer/src';
import { QualityVerifierAgent } from '../../../../packages/agents/quality-verifier/src';
import { LinkedInPublisherAgent } from '../../../../packages/agents/linkedin-publisher/src';
import { createSequentialAutomationWorkflow, type AutomationFlowNode } from '@infograph-ai/shared';

interface PipelineJobData {
  infographicId: string;
  userId: string;
  niche: string;
  topic?: string;
}

@Processor('agent-pipeline')
export class AgentPipelineProcessor {
  private readonly logger = new Logger(AgentPipelineProcessor.name);

  constructor(
    @InjectRepository(Infographic)
    private readonly infographicRepo: Repository<Infographic>,
    private readonly trendResearch: TrendResearchAgent,
    private readonly contentStrategist: ContentStrategistAgent,
    private readonly contentWriter: ContentWriterAgent,
    private readonly infographicDesigner: InfographicDesignerAgent,
    private readonly qualityVerifier: QualityVerifierAgent,
    private readonly linkedinPublisher: LinkedInPublisherAgent,
  ) {}

  @Process('run-pipeline')
  async handle(job: Job<PipelineJobData>) {
    const { infographicId, niche, topic } = job.data;
    const trace: Record<string, unknown> = {};
    trace.workflow = createSequentialAutomationWorkflow(
      `workflow-${infographicId}`,
      `${topic || niche} automation pipeline`,
      [
        { id: 'trend-research', kind: 'agent', label: 'Trend Research', config: { agentId: 'trend-research' } },
        { id: 'content-strategist', kind: 'agent', label: 'Content Strategist', config: { agentId: 'content-strategist' } },
        { id: 'content-writer', kind: 'agent', label: 'Content Writer', config: { agentId: 'content-writer' } },
        { id: 'infographic-designer', kind: 'agent', label: 'Infographic Designer', config: { agentId: 'infographic-designer' } },
        { id: 'quality-verifier', kind: 'agent', label: 'Quality Verifier', config: { agentId: 'quality-verifier' } },
        { id: 'linkedin-publisher', kind: 'agent', label: 'LinkedIn Publisher', config: { agentId: 'linkedin-publisher' } },
      ] satisfies AutomationFlowNode[],
    );

    const update = (status: Infographic['status']) =>
      this.infographicRepo.update(infographicId, { status, agentTrace: trace });

    try {
      // ── Agent 1: Trend Research ──────────────────────────────────────────
      await update('researching');
      const trendResult = await this.trendResearch.run({ niche, topic });
      trace.trendResearch = trendResult;
      this.logger.log(`[${infographicId}] Trend → ${trendResult.topic}`);

      // ── Agent 2: Content Strategist ──────────────────────────────────────
      await update('strategizing');
      const strategyResult = await this.contentStrategist.run(trendResult);
      trace.strategy = strategyResult;

      // ── Agent 3: Content Writer ──────────────────────────────────────────
      await update('writing');
      const contentResult = await this.contentWriter.run({ trendResult, strategyResult });
      trace.content = contentResult;

      // ── Agent 4: Infographic Designer ────────────────────────────────────
      await update('designing');
      const designResult = await this.infographicDesigner.run(contentResult);
      trace.design = designResult;

      // ── Agent 5: Quality Verifier ────────────────────────────────────────
      await update('verifying');
      const verifyResult = await this.qualityVerifier.run({
        content: contentResult,
        design: designResult,
      });
      trace.verify = verifyResult;

      if (!verifyResult.passed) {
        throw new Error(`Quality check failed: ${verifyResult.issues.join(', ')}`);
      }

      // ── Agent 6: LinkedIn Publisher ──────────────────────────────────────
      const publishResult = await this.linkedinPublisher.prepare({
        content: contentResult,
        imageUrl: designResult.imageUrl,
      });
      trace.publish = publishResult;

      await this.infographicRepo.update(infographicId, {
        topic: trendResult.topic,
        trendScore: trendResult.importance,
        hook: strategyResult.hook,
        bodyContent: contentResult.body,
        caption: publishResult.caption,
        hashtags: publishResult.hashtags,
        imageUrl: designResult.imageUrl,
        svgSource: designResult.svg,
        status: 'scheduled',
        agentTrace: trace,
      });

      this.logger.log(`[${infographicId}] Pipeline completed ✓`);
    } catch (err) {
      this.logger.error(`[${infographicId}] Pipeline failed: ${(err as Error).message}`);
      await this.infographicRepo.update(infographicId, {
        status: 'failed',
        agentTrace: { ...trace, error: (err as Error).message },
      });
      throw err;
    }
  }
}
