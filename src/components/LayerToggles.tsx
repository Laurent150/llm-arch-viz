import { useMemo, type CSSProperties } from 'react'
import type { ModelFamilyCard, OverlayLayer } from '../types/architecture'
import { OVERLAY_GROUPS } from '../data/overlayGroups'

interface Props {
  overlays: OverlayLayer[]
  activeIds: Set<string>
  onToggle: (id: string) => void
  onClear: () => void
  trainingView: boolean
  onToggleTraining: () => void
  modelPacks: ModelFamilyCard[]
  activePackId: string | null
  onApplyPack: (family: ModelFamilyCard) => void
  /** false = expanded chip list (default UX); true = icon-only rail */
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

function roleTag(o: OverlayLayer) {
  if (o.role === 'inference') return '推理期'
  if (o.role === 'training') return '训练期'
  if (o.role === 'addon') return '可选'
  return '可替代'
}

export function LayerToggles({
  overlays,
  activeIds,
  onToggle,
  onClear,
  trainingView,
  onToggleTraining,
  modelPacks,
  activePackId,
  onApplyPack,
  collapsed,
  onCollapsedChange,
}: Props) {
  const byId = useMemo(() => {
    const m = new Map<string, OverlayLayer>()
    for (const o of overlays) m.set(o.id, o)
    return m
  }, [overlays])

  const active = overlays.filter((o) => activeIds.has(o.id))
  const activeCount = activeIds.size

  return (
    <aside
      className={`overlay-sidebar ${collapsed ? 'is-collapsed' : 'is-expanded'}`}
      aria-label="叠加层侧栏"
    >
      <div className="overlay-sidebar__chrome">
        <button
          type="button"
          className={`overlay-sidebar__toggle ${collapsed ? 'is-collapsed-toggle' : ''}`}
          aria-expanded={!collapsed}
          aria-controls="overlay-sidebar-panel"
          onClick={() => onCollapsedChange(!collapsed)}
          title={collapsed ? '展开叠加层（显示全部芯片）' : '收起侧栏'}
          aria-label={collapsed ? '展开叠加层侧栏' : '收起叠加层侧栏'}
        >
          {collapsed ? (
            <span className="overlay-sidebar__toggle-icon" aria-hidden>
              ≫
            </span>
          ) : (
            <>
              <span className="overlay-sidebar__toggle-text">叠加层</span>
              {activeCount > 0 && (
                <span className="overlay-sidebar__badge" title={`已开 ${activeCount} 层`}>
                  {activeCount}
                </span>
              )}
              <span className="overlay-sidebar__toggle-icon overlay-sidebar__toggle-icon--collapse" aria-hidden>
                ≪
              </span>
            </>
          )}
        </button>
      </div>

      {/* Expanded: real categorized chips */}
      {!collapsed && (
        <div id="overlay-sidebar-panel" className="overlay-sidebar__body">
          <div className="overlay-sidebar__head">
            <p className="overlay-sidebar__hint muted">
              分类下列出<strong>可点击芯片</strong>（RoPE / MoE / CSA…），融合到基线地图
            </p>
            {activeCount > 0 && (
              <button
                type="button"
                className="btn-ghost overlay-sidebar__clear"
                onClick={onClear}
              >
                清除
              </button>
            )}
          </div>

          <div className="overlay-sidebar__train" role="group" aria-label="视角开关">
            <button
              type="button"
              className={`view-toggle view-toggle--compact ${trainingView ? 'is-on' : ''}`}
              aria-pressed={trainingView}
              onClick={onToggleTraining}
              title="训练视角"
            >
              <span className="view-toggle__label">训练视角</span>
              <span className="view-toggle__state">{trainingView ? '开' : '关'}</span>
            </button>
          </div>

          <div className="overlay-sidebar__packs" role="group" aria-label="开源模型融合包">
            <h3 className="overlay-sidebar__group-title">模型包</h3>
            <div className="overlay-sidebar__pack-list">
              {modelPacks.map((p) => {
                const on = activePackId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`model-pack-chip model-pack-chip--sidebar ${on ? 'is-on' : ''}`}
                    aria-pressed={on}
                    onClick={() => onApplyPack(p)}
                    style={
                      {
                        '--pack-accent': p.packAccent ?? 'var(--accent)',
                      } as CSSProperties
                    }
                    title={(p.overlayPackIds ?? []).join(' + ')}
                  >
                    {p.nameZh}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="overlay-sidebar__baseline">
            <h3 className="overlay-sidebar__group-title">基线</h3>
            <span
              className="layer-chip layer-chip--baseline layer-chip--sidebar"
              title="始终显示的稠密 Decoder 基线"
            >
              <i className="layer-dot" style={{ background: 'var(--accent)' }} />
              <span className="layer-chip__zh">稠密 Decoder</span>
              <span className="layer-chip__tag">基线</span>
            </span>
          </div>

          {OVERLAY_GROUPS.map((g) => {
            const items = g.overlayIds
              .map((id) => byId.get(id))
              .filter((o): o is OverlayLayer => Boolean(o))
            if (items.length === 0) return null
            return (
              <div
                key={g.id}
                className="overlay-sidebar__group"
                role="group"
                aria-label={g.titleZh}
              >
                <h3 className="overlay-sidebar__group-title">{g.titleZh}</h3>
                <div className="overlay-sidebar__chips">
                  {items.map((o) => {
                    const on = activeIds.has(o.id)
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={`layer-chip layer-chip--sidebar ${on ? 'is-on' : ''}`}
                        aria-pressed={on}
                        onClick={() => onToggle(o.id)}
                        style={{ '--layer-accent': o.accent } as CSSProperties}
                        title={`${o.nameEn} · ${o.roleLabelZh}\n来源：${o.source.noteZh || o.source.title}`}
                      >
                        <i className="layer-dot" style={{ background: o.accent }} />
                        <span className="layer-chip__zh">{o.nameZh}</span>
                        <span className="layer-chip__tag layer-chip__tag--opt">
                          {roleTag(o)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {active.length > 0 && (
            <div className="overlay-sidebar__notes">
              <h3 className="overlay-sidebar__group-title">已开启说明</h3>
              {active.map((o) => (
                <div
                  key={o.id}
                  className="layer-note layer-note--compact"
                  style={{ borderColor: o.accent }}
                >
                  <strong style={{ color: o.accent }}>{o.nameZh}</strong>
                  <p className="layer-note__src muted">来源：{o.source.noteZh || o.source.title}</p>
                  <p>{o.blurbZh}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapsed: icon-only rail — dots only, NO category text stubs */}
      {collapsed && (
        <div className="overlay-sidebar__rail" aria-label="叠加层图标条（点击展开）">
          <button
            type="button"
            className={`rail-icon ${trainingView ? 'is-on' : ''}`}
            onClick={onToggleTraining}
            title={`训练视角：${trainingView ? '开' : '关'}（点此切换）`}
            aria-label="切换训练视角"
          >
            <span className="rail-icon__dot" style={{ background: '#fb923c' }} />
          </button>
          {overlays.map((o) => {
            const on = activeIds.has(o.id)
            return (
              <button
                key={o.id}
                type="button"
                className={`rail-icon ${on ? 'is-on' : ''}`}
                style={{ '--layer-accent': o.accent } as CSSProperties}
                title={`${o.nameZh}（${on ? '已开' : '关'}）· 单击切换；双击区域外请先 ≫ 展开侧栏看全名`}
                aria-label={`${o.nameZh}，${on ? '已开启' : '未开启'}，点击切换`}
                aria-pressed={on}
                onClick={() => onToggle(o.id)}
                onDoubleClick={() => onCollapsedChange(false)}
              >
                <span className="rail-icon__dot" style={{ background: o.accent }} />
              </button>
            )
          })}
          <button
            type="button"
            className="rail-icon rail-icon--expand"
            onClick={() => onCollapsedChange(false)}
            title="展开侧栏查看分类芯片全名"
            aria-label="展开叠加层侧栏"
          >
            <span className="rail-icon__plus">+</span>
          </button>
        </div>
      )}
    </aside>
  )
}
