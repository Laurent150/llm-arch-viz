/**
 * Legacy single-variant list kept for V2 paper-diff merge targets.
 * V1 UI uses `overlays.ts` (multi-select optional/replaceable layers) instead.
 */
import type { ArchitectureVariant } from '../types/architecture'
import { OVERLAYS } from './overlays'

/** Dense baseline — always the map; not an overlay toggle */
export const DENSE_BASELINE: ArchitectureVariant = {
  id: 'dense-gpt',
  nameZh: '标准稠密 Decoder',
  nameEn: 'Dense GPT-style Transformer',
  blurbZh:
    '经典因果 Decoder-Only：多头自注意力 + 稠密 FFN。本工具的「基线 / 通常都有」地图。',
  source: {
    title: 'Attention Is All You Need; GPT-2/3 public papers',
    year: 2017,
    noteZh: '公开论文与技术报告中的通用结构，非任何公司内部实现图。',
    url: 'https://arxiv.org/abs/1706.03762',
  },
  moduleDiff: {
    tokens: 'unchanged',
    embedding: 'unchanged',
    block: 'unchanged',
    attention: 'unchanged',
    ffn: 'unchanged',
    norm: 'unchanged',
    lm_head: 'unchanged',
  },
  highlightNotesZh: ['基线地图：所有核心模块通常都有。'],
}

/** Flatten overlays into ArchitectureVariant shape for V2 hooks */
export const VARIANTS: ArchitectureVariant[] = [
  DENSE_BASELINE,
  ...OVERLAYS.map((o) => ({
    id: o.id,
    nameZh: o.nameZh,
    nameEn: o.nameEn,
    blurbZh: o.blurbZh,
    source: o.source,
    moduleDiff: Object.fromEntries(
      o.highlightModuleIds.map((id) => [
        id,
        o.role === 'alternative' ? ('replaced' as const) : ('modified' as const),
      ]),
    ),
    extraModuleIds: o.attachments.map((a) => a.moduleId),
    highlightNotesZh: o.highlightNotesZh,
  })),
]

export const DEFAULT_VARIANT_ID = 'dense-gpt'
