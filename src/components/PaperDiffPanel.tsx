import { useState } from 'react'
import {
  listPendingDiffs,
  proposeDiffFromPaper,
  NotImplementedError,
} from '../api/paperDiff'

/**
 * V2 hook UI: visible entry point, clearly not implemented.
 * Does not fake auto-parsing results.
 */
export function PaperDiffPanel() {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const tryPropose = async () => {
    setMsg(null)
    try {
      await proposeDiffFromPaper({
        title: '（示例）尚未实现',
        excerpt: 'V1 仅预留接口，不会解析 PDF。',
      })
    } catch (e) {
      if (e instanceof NotImplementedError) {
        setMsg(e.message)
      } else {
        setMsg(String(e))
      }
    }
  }

  const tryList = async () => {
    setMsg(null)
    const list = await listPendingDiffs()
    setMsg(`待审 Diff 数量：${list.length}（V1 固定返回空列表）`)
  }

  return (
    <section className="v2-panel">
      <div className="section-head">
        <h2>V2 扩展预留</h2>
        <p className="muted">论文 Diff：上传 → 提议差异 → 人工确认 → 合并进主图</p>
      </div>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        从论文生成 Diff · 即将推出
      </button>
      {open && (
        <div className="v2-placeholder">
          <p>
            <strong>计划流程（未实现自动解析）：</strong>
          </p>
          <ol>
            <li>粘贴论文元数据 / 摘要（可选本地 PDF，V2）</li>
            <li>
              调用 <code>proposeDiffFromPaper()</code> 生成{' '}
              <code>ArchitectureDiff</code>（状态：suggested）
            </li>
            <li>人工审核证据句与模块映射 → approved / rejected</li>
            <li>
              <code>applyApprovedDiff(id)</code> 合并进变体数据
            </li>
          </ol>
          <p className="warn">
            V1 不会自动读 PDF，也不会假装已经改好了架构图。类型定义见{' '}
            <code>src/types/paperDiff.ts</code>，API 桩见{' '}
            <code>src/api/paperDiff.ts</code>。
          </p>
          <div className="v2-actions">
            <button type="button" className="btn-secondary" disabled title="即将推出">
              上传论文（禁用）
            </button>
            <button type="button" className="btn-secondary" onClick={tryPropose}>
              试调 proposeDiffFromPaper
            </button>
            <button type="button" className="btn-secondary" onClick={tryList}>
              试调 listPendingDiffs
            </button>
          </div>
          {msg && <pre className="v2-msg">{msg}</pre>}
        </div>
      )}
    </section>
  )
}
