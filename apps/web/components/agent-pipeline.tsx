/**
 * Agent pipeline status component.
 * Shows real-time progress through the 6-agent pipeline via Server-Sent Events.
 */
export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface AgentStep {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  output?: string;
  durationMs?: number;
}

interface AgentPipelineProps {
  steps: AgentStep[];
}

const statusIcon: Record<AgentStatus, string> = {
  idle: '○',
  running: '◐',
  completed: '✓',
  failed: '✗',
};

const statusClass: Record<AgentStatus, string> = {
  idle: 'text-gray-400',
  running: 'text-blue-500 animate-pulse',
  completed: 'text-green-500',
  failed: 'text-red-500',
};

export function AgentPipeline({ steps }: AgentPipelineProps) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={step.id} className="flex items-start gap-4">
          {/* Step number + connector */}
          <div className="flex flex-col items-center">
            <span className={`text-lg font-mono ${statusClass[step.status]}`}>
              {statusIcon[step.status]}
            </span>
            {i < steps.length - 1 && (
              <div className="w-px h-6 bg-gray-200 mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{step.name}</p>
              {step.durationMs && (
                <span className="text-xs text-gray-400">
                  {(step.durationMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{step.description}</p>
            {step.output && step.status === 'completed' && (
              <pre className="mt-1 text-xs bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                {step.output}
              </pre>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Default pipeline steps for a fresh generation run */
export const DEFAULT_PIPELINE_STEPS: AgentStep[] = [
  {
    id: 'trend-research',
    name: 'Trend Research Agent',
    description: 'Scanning GitHub, Hacker News, Reddit, and engineering blogs',
    status: 'idle',
  },
  {
    id: 'content-strategist',
    name: 'Content Strategist',
    description: 'Crafting LinkedIn hook and content angle',
    status: 'idle',
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    description: 'Writing infographic body, captions, and CTA',
    status: 'idle',
  },
  {
    id: 'infographic-designer',
    name: 'Infographic Designer',
    description: 'Generating SVG layout and visual assets',
    status: 'idle',
  },
  {
    id: 'quality-verifier',
    name: 'Quality Verifier',
    description: 'Checking grammar, technical accuracy, and brand consistency',
    status: 'idle',
  },
  {
    id: 'linkedin-publisher',
    name: 'LinkedIn Publisher',
    description: 'Preparing post, hashtags, and scheduling',
    status: 'idle',
  },
];
