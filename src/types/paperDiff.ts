/**
 * V2 extension types — Paper → Architecture Diff
 *
 * These types define the contract for a future feature:
 * upload/paste a paper → propose a structured diff against the canonical map
 * → human review (approve/reject) → merge into variant data.
 *
 * V1 only ships types + API stubs. No auto PDF parsing.
 */

import type { DiffStatus } from './architecture'

/** Lifecycle of a proposed change before it can affect the main map */
export type ReviewStatus = 'suggested' | 'approved' | 'rejected'

/** A span of evidence quoted/linked from the paper */
export interface EvidenceSpan {
  /** Short quote or paraphrase (Chinese or English) */
  text: string
  /** Optional page / section hint from the paper */
  locator?: string
  /** Optional character offsets if full text is available later */
  start?: number
  end?: number
}

/** One claimed contribution relative to a baseline architecture */
export interface PaperContribution {
  id: string
  /** Module id on the canonical (or baseline) map, if mappable */
  moduleId?: string
  /** Free-form label when no module maps cleanly */
  labelZh: string
  status: DiffStatus
  summaryZh: string
  evidence: EvidenceSpan[]
}

/** Structured diff proposal produced (in V2) from a paper */
export interface ArchitectureDiff {
  id: string
  /** Paper metadata only — no binary PDF required in the type */
  paper: {
    title: string
    authors?: string[]
    year?: number
    url?: string
    /** Optional local file handle / path for V2 upload pipeline */
    localRef?: string
  }
  /** Baseline architecture / variant id this diff is against */
  baselineVariantId: string
  contributions: PaperContribution[]
  reviewStatus: ReviewStatus
  createdAt: string
  updatedAt?: string
  /** Reviewer notes when approving / rejecting */
  reviewNoteZh?: string
}

/** Input metadata for proposing a diff (V2). Full text optional. */
export interface PaperMetaInput {
  title: string
  authors?: string[]
  year?: number
  url?: string
  /** Abstract or pasted excerpt — NOT a promise of full PDF parse */
  excerpt?: string
  baselineVariantId?: string
}
