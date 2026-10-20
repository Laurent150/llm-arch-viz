/** Core architecture types for V1 visualization */

export type DiffStatus = 'unchanged' | 'modified' | 'added' | 'replaced' | 'removed'

/** Architecture map vs training-time concepts (backprop / optimizer) */
export type ModulePhase = 'architecture' | 'training'

export interface TensorNote {
  /** e.g. "[B, T, d_model]" */
  shape: string
  /** short Chinese label */
  label: string
}

/** Optional named subsection in the detail panel (e.g. AdamW vs Muon) */
export interface ModuleDetailSection {
  id: string
  titleZh: string
  /** Small chip next to title, e.g. 「主流」「矩阵专精」 */
  badgeZh?: string
  bodyZh: string
  formula?: string
  formulaText?: string
  bulletsZh?: string[]
}

export interface ModuleNode {
  id: string
  /** Chinese display name */
  nameZh: string
  /** English short name */
  nameEn: string
  /** Plain-language explanation (Chinese) */
  summaryZh: string
  /** KaTeX-compatible LaTeX (without surrounding $$) */
  formula?: string
  /** Human-readable Unicode fallback if KaTeX fails */
  formulaText?: string
  inputs: TensorNote[]
  outputs: TensorNote[]
  /** Extra bullets for scannability */
  bulletsZh?: string[]
  /** Structured detail blocks rendered below bullets */
  detailSections?: ModuleDetailSection[]
  /** Tiny chips on the map card (e.g. AdamW / Muon) */
  cardBadgesZh?: string[]
  /** Optional link to public paper / docs */
  refs?: { title: string; year?: number; url?: string }[]
  /**
   * Default architecture (forward structure).
   * 'training' = backprop / loss / optimizer — not part of inference graph.
   */
  phase?: ModulePhase
}

export interface PipelineEdge {
  from: string
  to: string
  labelZh?: string
}

/** How an overlay annotation attaches to the canonical pipeline */
export type AttachmentKind = 'badge' | 'branch-in' | 'loop'

/** Relationship to the dense baseline — never imply "all on at once" */
export type OverlayRole = 'alternative' | 'addon' | 'inference' | 'training'

export interface OverlayAttachment {
  /** Canonical node id to hang on (tokens | embedding | attention | ffn | …) */
  targetId: string
  kind: AttachmentKind
  /** Short chip label on the diagram */
  labelZh: string
  /** 「可选」「替代」「推理期」 */
  badgeKindZh: '可选' | '替代' | '推理期' | '训练期'
  /** Module opened when the annotation is clicked */
  moduleId: string
}

/**
 * Orthogonal overlay layer (RoPE / MoE / …) stacked on the dense baseline.
 * Multi-select is for comparison only — layers are optional / replaceable.
 */
export interface OverlayLayer {
  id: string
  nameZh: string
  nameEn: string
  /** Accent used for chips / badges */
  accent: string
  role: OverlayRole
  /** e.g. 「可选 · 替代稠密 FFN」 */
  roleLabelZh: string
  blurbZh: string
  source: {
    title: string
    year: number
    noteZh: string
    url?: string
  }
  attachments: OverlayAttachment[]
  /** Canonical modules to soft-highlight when this overlay is on */
  highlightModuleIds: string[]
  highlightNotesZh?: string[]
}

/** Kept for V2 paper-diff merge target compatibility */
export interface ArchitectureVariant {
  id: string
  nameZh: string
  nameEn: string
  blurbZh: string
  source: {
    title: string
    year: number
    noteZh: string
    url?: string
  }
  moduleDiff: Record<string, DiffStatus>
  highlightNotesZh?: string[]
  extraModuleIds?: string[]
}

export interface ModelFamilyCard {
  id: string
  nameZh: string
  nameEn: string
  /** Only publicly documented traits */
  traitsZh: string[]
  sources: { title: string; year: number; url?: string }[]
  /**
   * Overlay layer ids to enable when this family pack is selected.
   * Fuses onto the shared baseline — does not draw a parallel diagram.
   */
  overlayPackIds?: string[]
  /**
   * Training-side public method overlay ids (Muon / AdamW / schedules / QAT…).
   * Applied together with overlayPackIds; badges show under 训练视角.
   */
  trainingPackIds?: string[]
  /** Accent for pack chip / selected card */
  packAccent?: string
}
