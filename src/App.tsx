import { useCallback, useMemo, useState } from 'react'
import { MODULES } from './data/modules'
import { OVERLAYS } from './data/overlays'
import { FAMILIES, MODEL_PACKS } from './data/families'
import type { ModelFamilyCard } from './types/architecture'
import { PipelineMap } from './components/PipelineMap'
import { DetailPanel } from './components/DetailPanel'
import { LayerToggles } from './components/LayerToggles'
import { FamilyCards } from './components/FamilyCards'
import { PaperDiffPanel } from './components/PaperDiffPanel'
import './App.css'

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [activeOverlayIds, setActiveOverlayIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [activePackId, setActivePackId] = useState<string | null>(null)
  const [trainingView, setTrainingView] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const activeOverlays = useMemo(
    () => OVERLAYS.filter((o) => activeOverlayIds.has(o.id)),
    [activeOverlayIds],
  )

  const highlightedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const o of activeOverlays) {
      for (const id of o.highlightModuleIds) ids.add(id)
      for (const a of o.attachments) ids.add(a.moduleId)
    }
    return ids
  }, [activeOverlays])

  const toggleOverlay = useCallback((id: string) => {
    setActivePackId(null) // manual tweak leaves pack selection
    setActiveOverlayIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearOverlays = useCallback(() => {
    setActiveOverlayIds(new Set())
    setActivePackId(null)
  }, [])

  /** Apply fused structure + training-method packs onto shared baseline. */
  const applyPack = useCallback((family: ModelFamilyCard) => {
    const pack = family.overlayPackIds
    const trainPack = family.trainingPackIds ?? []
    if (!pack || pack.length === 0) {
      // e.g. GPT public lineage — clear overlays for pure baseline
      if (activePackId === family.id) {
        setActivePackId(null)
      } else {
        setActiveOverlayIds(new Set(trainPack))
        setActivePackId(family.id)
      }
      return
    }
    if (activePackId === family.id) {
      setActiveOverlayIds(new Set())
      setActivePackId(null)
      return
    }
    setActiveOverlayIds(new Set([...pack, ...trainPack]))
    setActivePackId(family.id)
  }, [activePackId])

  const selectedModule = selectedId ? (MODULES[selectedId] ?? null) : null

  const selectedOverlayLabels = useMemo(() => {
    if (!selectedId) return []
    return activeOverlays
      .filter(
        (o) =>
          o.highlightModuleIds.includes(selectedId) ||
          o.attachments.some((a) => a.moduleId === selectedId || a.targetId === selectedId),
      )
      .map((o) => ({ id: o.id, nameZh: o.nameZh, accent: o.accent }))
  }, [selectedId, activeOverlays])

  const closePanel = useCallback(() => setSelectedId(null), [])

  return (
    <div className={`app theme-${theme}`}>
      <header className="topbar">
        <div>
          <p className="eyebrow">LLM Arch Viz · V1</p>
          <h1>大模型架构可视化</h1>
          <p className="tagline">
            一张居中流水线 · 开源模型包融合叠加 · 仅基于公开论文 / 报告
          </p>
        </div>
        <div className="topbar__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? '浅色主题' : '深色主题'}
          </button>
        </div>
      </header>

      <main
        className={`layout layout--with-sidebar ${sidebarCollapsed ? 'layout--rail' : 'layout--sidebar-open'} ${selectedModule ? 'layout--detail' : ''}`}
      >
        <LayerToggles
          overlays={OVERLAYS}
          activeIds={activeOverlayIds}
          onToggle={toggleOverlay}
          onClear={clearOverlays}
          trainingView={trainingView}
          onToggleTraining={() => setTrainingView((v) => !v)}
          modelPacks={MODEL_PACKS}
          activePackId={activePackId}
          onApplyPack={applyPack}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        <div className="layout__primary">
          <section className="map-section">
            <div className="section-head section-head--center">
              <h2>Canonical 流水线</h2>
              <p className="muted">
                Token → Embedding(+Pos) → Block×N（Attention → FFN → Norm）→ LM Head →
                采样/解码 → 输出文本
                {activePackId
                  ? ` · 当前融合包：${FAMILIES.find((f) => f.id === activePackId)?.nameZh ?? activePackId}`
                  : ''}
                {trainingView ? ' · 下方虚线为训练期反向路径（Loss 接 logits，不含采样）' : ''}
              </p>
            </div>
            <PipelineMap
              selectedId={selectedId}
              onSelect={setSelectedId}
              activeOverlays={activeOverlays}
              highlightedIds={highlightedIds}
              trainingView={trainingView}
            />
          </section>

          <FamilyCards
            families={FAMILIES}
            activePackId={activePackId}
            onSelectPack={applyPack}
          />
          <PaperDiffPanel />

          <footer className="disclaimer">
            <strong>免责声明：</strong>
            本工具为教学级架构浏览器。所有结构均来自公开论文、技术报告或开源模型卡；
            不声称复刻任何公司未公开的内部实现。模型包仅融合公开选件徽章到共享基线。
            训练视角中的 Loss / Autograd / 优化器属于训练期概念，不是推理架构模块。
          </footer>
        </div>

        <DetailPanel
          module={selectedModule}
          overlayLabels={selectedOverlayLabels}
          onClose={closePanel}
        />
      </main>
    </div>
  )
}
