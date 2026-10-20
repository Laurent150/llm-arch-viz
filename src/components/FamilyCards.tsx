import type { CSSProperties } from 'react'
import type { ModelFamilyCard } from '../types/architecture'

interface Props {
  families: ModelFamilyCard[]
  activePackId: string | null
  onSelectPack: (family: ModelFamilyCard) => void
}

export function FamilyCards({ families, activePackId, onSelectPack }: Props) {
  return (
    <section className="family-cards">
      <div className="section-head">
        <h2>公开模型族 · 融合叠加包</h2>
        <p className="muted">
          点击卡片，在<strong>同一张基线地图</strong>上打开该家族公开选件（徽章挂在 Embed / Attention / FFN /
          Norm），不是另画一张并行结构图。可再在上方叠加层里微调单个开关。
        </p>
      </div>
      <div className="family-grid">
        {families.map((f) => {
          const hasPack = Boolean(f.overlayPackIds && f.overlayPackIds.length > 0)
          const selected = activePackId === f.id
          return (
            <article
              key={f.id}
              className={`family-card ${selected ? 'is-selected' : ''} ${hasPack ? 'family-card--pack' : ''}`}
              style={
                f.packAccent
                  ? ({ '--pack-accent': f.packAccent } as CSSProperties)
                  : undefined
              }
            >
              <h3>
                {f.nameZh} <span className="muted en">{f.nameEn}</span>
              </h3>
              {hasPack && (
                <p className="family-pack-line">
                  <span className="family-pack-chips">
                    {f.overlayPackIds!.map((id) => (
                      <span key={id} className="family-pack-chip">
                        {id}
                      </span>
                    ))}
                  </span>
                </p>
              )}
              <ul className="bullets">
                {f.traitsZh.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="family-sources">
                <strong>来源</strong>
                <ul className="refs">
                  {f.sources.map((s) => (
                    <li key={s.title}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.title} ({s.year})
                        </a>
                      ) : (
                        <span>
                          {s.title} ({s.year})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                className={`family-pack-btn ${selected ? 'is-on' : ''}`}
                onClick={() => onSelectPack(f)}
                disabled={!hasPack && f.id !== 'gpt-public'}
                title={
                  hasPack
                    ? '在基线上融合打开该家族叠加包'
                    : '保持稠密 Decoder 基线，不强制叠加'
                }
              >
                {selected
                  ? hasPack
                    ? '已融合此包（再点可关闭）'
                    : '已选基线对照'
                  : hasPack
                    ? '融合到基线地图'
                    : '查看纯基线'}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
