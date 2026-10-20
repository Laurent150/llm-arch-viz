/**
 * V2 Paper Diff API stubs.
 *
 * Intentionally unimplemented in V1. UI should call these through a
 * "即将推出" panel only — do not fake auto-parsing results.
 *
 * Extension points for V2:
 * 1. proposeDiffFromPaper — NLP / structured extraction → ArchitectureDiff
 * 2. listPendingDiffs — queue of suggested diffs awaiting human review
 * 3. applyApprovedDiff — merge approved diff into variant seed / store
 */

import type { ArchitectureDiff, PaperMetaInput } from '../types/paperDiff'

export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`[V2 stub] ${feature} 尚未实现。请等待「从论文生成 Diff」功能上线。`)
    this.name = 'NotImplementedError'
  }
}

/**
 * Propose an architecture diff from paper metadata / excerpt.
 * V2: run extraction → return reviewStatus: 'suggested'.
 */
export async function proposeDiffFromPaper(
  _meta: PaperMetaInput,
): Promise<ArchitectureDiff> {
  // TODO(V2): parse excerpt / PDF → PaperContribution[] with EvidenceSpan
  throw new NotImplementedError('proposeDiffFromPaper')
}

/**
 * List diffs waiting for human approval.
 * V2: read from local store / backend queue.
 */
export async function listPendingDiffs(): Promise<ArchitectureDiff[]> {
  // TODO(V2): return diffs where reviewStatus === 'suggested'
  return []
}

/**
 * Apply an approved diff into the active architecture data.
 * V2: only accept reviewStatus === 'approved'; update variant moduleDiff.
 */
export async function applyApprovedDiff(_id: string): Promise<void> {
  // TODO(V2): validate approval → merge into variant catalog
  throw new NotImplementedError('applyApprovedDiff')
}

/**
 * Reject a suggested diff (stub for V2 review UI).
 */
export async function rejectDiff(_id: string, _noteZh?: string): Promise<void> {
  // TODO(V2): set reviewStatus = 'rejected'
  throw new NotImplementedError('rejectDiff')
}
