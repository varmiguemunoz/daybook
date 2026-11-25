export const LABEL_IDS = ['design', 'frontend', 'backend', 'research', 'content', 'bug', 'qa', 'growth'] as const;

export type LabelId = (typeof LABEL_IDS)[number];

export const LABEL_LABELS: Record<LabelId, string> = {
  design: 'Design',
  frontend: 'Frontend',
  backend: 'Backend',
  research: 'Research',
  content: 'Content',
  bug: 'Bug',
  qa: 'QA',
  growth: 'Growth',
};
