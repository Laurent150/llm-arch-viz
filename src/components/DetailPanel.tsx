import { useEffect } from 'react'
import type { ModuleNode } from '../types/architecture'
import { Formula } from './Formula'

interface OverlayLabel {
  id: string
  nameZh: string
  accent: string
}

interface Props {
  module: ModuleNode | null
  overlayLabels?: OverlayLabel[]
  onClose: () => void
}

export function DetailPanel({ module, overlayLabels = [], onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!module) return null

  const isTraining = module.phase === 'training'
  const sections = module.detailSections ?? []

  return (
    <aside className="detail-panel" role="dialog" aria-label={`${module.nameZh} 详情`}>
      <div className="detail-panel__header">
        <div>
          <p className="breadcrumb">
            架构图 <span aria-hidden>/</span> {module.nameZh}
          </p>
          <h2>
            {module.nameZh}{' '}
            <span className="muted en">{module.nameEn}</span>
          </h2>
        </div>
        <button type="button" className="btn-icon" onClick={onClose} aria-label="关闭 (Esc)">
          ✕
        </button>
      </div>

      {isTraining && (
        <div className="overlay-badge-row">
          <span className="overlay-pill overlay-pill--train">训练期</span>
          <span className="muted" style={{ fontSize: '0.82rem' }}>
            不属于推理架构 · 与 KV Cache（推理）不同
          </span>
        </div>
      )}

      {module.cardBadgesZh && module.cardBadgesZh.length > 0 && (
        <div className="overlay-badge-row">
          {module.cardBadgesZh.map((b) => (
            <span key={b} className="overlay-pill overlay-pill--soft">
              {b}
            </span>
          ))}
        </div>
      )}

      {overlayLabels.length > 0 && (
        <div className="overlay-badge-row">
          {overlayLabels.map((o) => (
            <span
              key={o.id}
              className="overlay-pill"
              style={{ borderColor: o.accent, color: o.accent }}
            >
              叠加：{o.nameZh}
            </span>
          ))}
        </div>
      )}

      <p className="summary">{module.summaryZh}</p>

      {(module.formula || module.formulaText) && (
        <section>
          <h3>关键公式</h3>
          <Formula latex={module.formula} fallback={module.formulaText} />
        </section>
      )}

      <section className="io-grid">
        <div>
          <h3>输入</h3>
          <ul>
            {module.inputs.map((t) => (
              <li key={t.label}>
                <code>{t.shape}</code>
                <span>{t.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>输出</h3>
          <ul>
            {module.outputs.map((t) => (
              <li key={t.label}>
                <code>{t.shape}</code>
                <span>{t.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {module.bulletsZh && module.bulletsZh.length > 0 && (
        <section>
          <h3>速览</h3>
          <ul className="bullets">
            {module.bulletsZh.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      {sections.length > 0 && (
        <section className="detail-sections" aria-label="深入说明">
          <h3>深入</h3>
          <div className="detail-section-grid">
            {sections.map((s) => (
              <article key={s.id} className="detail-section-card" id={`detail-${s.id}`}>
                <header className="detail-section-card__head">
                  <h4>{s.titleZh}</h4>
                  {s.badgeZh && (
                    <span className="detail-section-card__badge">{s.badgeZh}</span>
                  )}
                </header>
                <p className="detail-section-card__body">{s.bodyZh}</p>
                {(s.formula || s.formulaText) && (
                  <Formula latex={s.formula} fallback={s.formulaText} />
                )}
                {s.bulletsZh && s.bulletsZh.length > 0 && (
                  <ul className="bullets">
                    {s.bulletsZh.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {module.refs && module.refs.length > 0 && (
        <section>
          <h3>公开来源</h3>
          <ul className="refs">
            {module.refs.map((r) => (
              <li key={r.title}>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer">
                    {r.title}
                    {r.year ? ` (${r.year})` : ''}
                  </a>
                ) : (
                  <span>
                    {r.title}
                    {r.year ? ` (${r.year})` : ''}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="hint">按 Esc 关闭</p>
    </aside>
  )
}
