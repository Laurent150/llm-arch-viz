import { useRef, type CSSProperties } from 'react'
import type { ModuleNode, OverlayAttachment, OverlayLayer } from '../types/architecture'
import { MODULES } from '../data/modules'
import { TrainBridgeOverlay } from './TrainBridgeOverlay'

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
  activeOverlays: OverlayLayer[]
  highlightedIds: Set<string>
  /** Training / backprop view (default off) */
  trainingView?: boolean
}

function NodeCard({
  module,
  selected,
  highlighted,
  onSelect,
  size = 'md',
  baselineTag,
  trainingTag,
  attachPort,
  portId,
  cardPortId,
}: {
  module: ModuleNode
  selected: boolean
  highlighted?: boolean
  onSelect: (id: string) => void
  size?: 'md' | 'sm'
  baselineTag?: boolean
  trainingTag?: boolean
  attachPort?: 'bottom' | 'top'
  /** data-train-port on the orange attach dot */
  portId?: string
  /** data-train-port on the card itself (for horizontal edge routing) */
  cardPortId?: string
}) {
  return (
    <button
      type="button"
      className={`node-card node-card--${size} ${selected ? 'is-selected' : ''} ${
        highlighted ? 'is-highlighted' : ''
      } ${trainingTag ? 'node-card--training' : ''} ${
        attachPort ? `node-card--attach-${attachPort}` : ''
      }`}
      onClick={() => onSelect(module.id)}
      aria-pressed={selected}
      data-train-port={cardPortId}
    >
      {baselineTag && <span className="node-card__base-tag">基线</span>}
      {trainingTag && <span className="node-card__train-tag">训练期</span>}
      <span className="node-card__name">{module.nameZh}</span>
      <span className="node-card__en">{module.nameEn}</span>
      {module.cardBadgesZh && module.cardBadgesZh.length > 0 && (
        <span className="node-card__badges">
          {module.cardBadgesZh.map((b) => (
            <span key={b} className="node-card__badge">
              {b}
            </span>
          ))}
        </span>
      )}
      {attachPort && (
        <span
          className={`attach-port attach-port--${attachPort}`}
          data-train-port={portId}
          aria-hidden
        />
      )}
    </button>
  )
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flow-arrow" aria-hidden>
      <span className="flow-arrow__line" />
      {label && <span className="flow-arrow__label">{label}</span>}
      <span className="flow-arrow__head">›</span>
    </div>
  )
}


function AnnotationBadge({
  attachment,
  accent,
  selected,
  onSelect,
  sourceCite,
  isTraining,
}: {
  attachment: OverlayAttachment
  accent: string
  selected: boolean
  onSelect: (id: string) => void
  sourceCite?: string
  isTraining?: boolean
}) {
  const tip = sourceCite
    ? `${attachment.badgeKindZh}：${attachment.labelZh}\n来源：${sourceCite}`
    : `${attachment.badgeKindZh}：${attachment.labelZh}`
  return (
    <button
      type="button"
      className={`anno-badge ${selected ? 'is-selected' : ''} ${
        isTraining ? 'anno-badge--training' : ''
      }`}
      style={{ '--layer-accent': accent } as CSSProperties}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(attachment.moduleId)
      }}
      title={tip}
    >
      <span className="anno-badge__kind">{attachment.badgeKindZh}</span>
      <span className="anno-badge__label">{attachment.labelZh}</span>
      {isTraining && (
        <span className="anno-badge__src" title={sourceCite}>
          开源
        </span>
      )}
    </button>
  )
}


function attachmentsFor(
  overlays: OverlayLayer[],
  targetId: string,
  kind?: OverlayAttachment['kind'],
) {
  const out: { overlay: OverlayLayer; attachment: OverlayAttachment }[] = []
  for (const overlay of overlays) {
    for (const attachment of overlay.attachments) {
      if (attachment.targetId !== targetId) continue
      if (kind && attachment.kind !== kind) continue
      out.push({ overlay, attachment })
    }
  }
  return out
}

/**
 * Backprop cards + grid spacer. Horizontal dashed links are drawn by SVG overlay.
 */
function BackpropLane({
  selectedId,
  onSelect,
  activeOverlays,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
  activeOverlays: OverlayLayer[]
}) {
  const loss = MODULES.loss
  const autograd = MODULES.autograd
  const opt = MODULES.optimizer_update
  const optBadges = attachmentsFor(activeOverlays, 'optimizer_update', 'badge')
  const autogradBadges = attachmentsFor(activeOverlays, 'autograd', 'badge')
  const lossBadges = attachmentsFor(activeOverlays, 'loss', 'badge')
  const distOn = activeOverlays.some((o) => o.id === 'dist_parallel')

  return (
    <div className="backprop-lane" aria-label="训练期反向传播路径">
      <p className="backprop-lane__banner">
        <span className="node-card__train-tag">训练期</span>
        <strong>反向路径（非推理结构）</strong>
        <span className="muted">
          ：与「采样 → 输出文本」推理链路不同 · 梯度从 Loss 经 Block 回参数 · 优化器在「更新参数」
        </span>
      </p>
      {distOn && (
        <p className="backprop-lane__dist-note muted">
          <strong>分布式速记</strong>
          ：ZeRO/FSDP 分片优化器态与参数 · TP 切层内矩阵 · PP 切层深 —
          描述多卡布局，不是第二条模型蜘蛛网
        </p>
      )}

      <ol className="backprop-flow">
        <li className="pipeline-flow__step backprop-flow__spacer" aria-hidden>
          <span className="backprop-spacer-label muted">← 梯度方向</span>
        </li>

        <li className="pipeline-flow__connector backprop-flow__h-gap" aria-hidden />

        <li className="pipeline-flow__step backprop-flow__anchor backprop-flow__anchor--left">
          <div className="node-slot">
            {optBadges.length > 0 && (
              <div className="anno-row anno-row--above">
                {optBadges.map(({ overlay, attachment }) => (
                  <AnnotationBadge
                    key={`${overlay.id}-${attachment.labelZh}`}
                    attachment={attachment}
                    accent={overlay.accent}
                    sourceCite={overlay.source.noteZh || overlay.source.title}
                    isTraining={overlay.role === 'training'}
                    selected={selectedId === attachment.moduleId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
            <NodeCard
              module={opt}
              selected={selectedId === opt.id}
              onSelect={onSelect}
              size="sm"
              trainingTag
              attachPort="top"
              portId="opt-in"
              cardPortId="opt-card"
            />
            <span className="backprop-underlabel muted">θ ← Opt(θ, ∇θ)</span>
          </div>
        </li>

        <li className="pipeline-flow__connector backprop-flow__h-gap" aria-hidden />

        <li className="pipeline-flow__step backprop-flow__anchor backprop-flow__anchor--mid">
          <div className="node-slot">
            {autogradBadges.length > 0 && (
              <div className="anno-row anno-row--above">
                {autogradBadges.map(({ overlay, attachment }) => (
                  <AnnotationBadge
                    key={`${overlay.id}-${attachment.labelZh}`}
                    attachment={attachment}
                    accent={overlay.accent}
                    sourceCite={overlay.source.noteZh || overlay.source.title}
                    isTraining={overlay.role === 'training'}
                    selected={selectedId === attachment.moduleId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
            <NodeCard
              module={autograd}
              selected={selectedId === autograd.id}
              onSelect={onSelect}
              size="sm"
              trainingTag
              attachPort="top"
              portId="autograd-in"
              cardPortId="autograd-card"
            />
            <span className="backprop-underlabel muted">∇ 穿过 Block×N</span>
          </div>
        </li>

        <li className="pipeline-flow__connector backprop-flow__h-gap" aria-hidden />

        <li className="pipeline-flow__step backprop-flow__anchor backprop-flow__anchor--right">
          <div className="node-slot">
            {lossBadges.length > 0 && (
              <div className="anno-row anno-row--above">
                {lossBadges.map(({ overlay, attachment }) => (
                  <AnnotationBadge
                    key={`${overlay.id}-${attachment.labelZh}`}
                    attachment={attachment}
                    accent={overlay.accent}
                    sourceCite={overlay.source.noteZh || overlay.source.title}
                    isTraining={overlay.role === 'training'}
                    selected={selectedId === attachment.moduleId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
            <NodeCard
              module={loss}
              selected={selectedId === loss.id}
              onSelect={onSelect}
              size="sm"
              trainingTag
              attachPort="top"
              portId="loss-in"
              cardPortId="loss-card"
            />
            <span className="backprop-underlabel muted">loss ← logits</span>
          </div>
        </li>

        <li className="pipeline-flow__connector backprop-flow__decode-pad" aria-hidden />
        <li className="pipeline-flow__step backprop-flow__decode-pad" aria-hidden />
        <li className="pipeline-flow__connector backprop-flow__decode-pad" aria-hidden />
        <li className="pipeline-flow__step backprop-flow__decode-pad" aria-hidden />
      </ol>

      <p className="backprop-lane__formula muted">
        示意：竖向橙线为端口折桥；横向虚线按卡片边缘实测连接 Loss←Autograd←Opt（∂L / ∇θ）。前向在 LM Head 分叉（训练接 Loss；推理继续采样 → 文本）。
      </p>
    </div>
  )
}

export function PipelineMap({
  selectedId,
  onSelect,
  activeOverlays,
  highlightedIds,
  trainingView = false,
}: Props) {
  const stackRef = useRef<HTMLDivElement>(null)

  const tokens = MODULES.tokens
  const embedding = MODULES.embedding
  const block = MODULES.block
  const attention = MODULES.attention
  const ffn = MODULES.ffn
  const norm = MODULES.norm
  const lmHead = MODULES.lm_head
  const sampling = MODULES.sampling
  const outputText = MODULES.output_text

  const visionBranches = attachmentsFor(activeOverlays, 'tokens', 'branch-in')
  const embedBadges = attachmentsFor(activeOverlays, 'embedding', 'badge')
  const attnBadges = attachmentsFor(activeOverlays, 'attention', 'badge')
  const attnLoops = attachmentsFor(activeOverlays, 'attention', 'loop')
  const ffnBadges = attachmentsFor(activeOverlays, 'ffn', 'badge')
  const normBadges = attachmentsFor(activeOverlays, 'norm', 'badge')
  const blockBadges = attachmentsFor(activeOverlays, 'block', 'badge')
  const moeOn = activeOverlays.some((o) => o.id === 'moe')

  return (
    <div className="pipeline-stage">
      <p className="pipeline-baseline-banner">
        <strong>基线 / 通常都有</strong>
        <span className="muted">
          ：Token → Embedding → Block（Attention → FFN → Norm）→ LM Head → 采样/解码 →
          输出文本。下方彩色标注均为可选或替代方案；训练开着时 Loss 只从 LM Head / logits
          垂线接入。
        </span>
      </p>

      <div className="pipeline-stage__canvas">
        {visionBranches.length > 0 && (
          <div className="vision-branch" aria-label="多模态视觉分支（可选附加）">
            {visionBranches.map(({ overlay, attachment }) => {
              const mod = MODULES[attachment.moduleId]
              if (!mod) return null
              return (
                <div
                  key={overlay.id}
                  className="vision-branch__card"
                  style={{ '--layer-accent': overlay.accent } as CSSProperties}
                >
                  <span className="vision-branch__opt-tag">可选 · 附加分支</span>
                  <NodeCard
                    module={mod}
                    selected={selectedId === mod.id}
                    highlighted
                    onSelect={onSelect}
                    size="sm"
                  />
                  <div className="vision-branch__merge" aria-hidden>
                    <span className="vision-branch__line" />
                    <span className="vision-branch__label">汇入</span>
                    <span className="vision-branch__head">↘</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div
          ref={stackRef}
          className={`train-stack ${trainingView ? 'train-stack--on' : ''}`}
        >
          <ol className="pipeline-flow">
            <li className="pipeline-flow__step pipeline-flow__col--tok">
              <div className="node-slot">
                <NodeCard
                  module={tokens}
                  selected={selectedId === tokens.id}
                  highlighted={highlightedIds.has(tokens.id)}
                  onSelect={onSelect}
                  baselineTag
                />
              </div>
            </li>

            <li className="pipeline-flow__connector pipeline-flow__col--a1" aria-hidden>
              <FlowArrow />
            </li>

            <li className="pipeline-flow__step pipeline-flow__col--embed pipeline-flow__anchor pipeline-flow__anchor--embed">
              <div className="node-slot">
                {embedBadges.length > 0 && (
                  <div className="anno-row anno-row--above">
                    {embedBadges.map(({ overlay, attachment }) => (
                      <AnnotationBadge
                        key={`${overlay.id}-${attachment.labelZh}`}
                        attachment={attachment}
                        accent={overlay.accent}
                        sourceCite={overlay.source.noteZh || overlay.source.title}
                        isTraining={overlay.role === 'training'}
                        selected={selectedId === attachment.moduleId}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                )}
                <NodeCard
                  module={embedding}
                  selected={selectedId === embedding.id}
                  highlighted={highlightedIds.has(embedding.id)}
                  onSelect={onSelect}
                  baselineTag
                  attachPort={trainingView ? 'bottom' : undefined}
                  portId={trainingView ? 'embed-out' : undefined}
                />
              </div>
            </li>

            <li className="pipeline-flow__connector pipeline-flow__col--a2" aria-hidden>
              <FlowArrow label="× N" />
            </li>

            <li className="pipeline-flow__step pipeline-flow__step--block pipeline-flow__col--block pipeline-flow__anchor pipeline-flow__anchor--block">
              <div
                className={`block-shell ${highlightedIds.has(block.id) ? 'is-highlighted' : ''} ${
                  trainingView ? 'block-shell--train-align' : ''
                }`}
              >
                {blockBadges.length > 0 && (
                  <div className="anno-row anno-row--block">
                    {blockBadges.map(({ overlay, attachment }) => (
                      <AnnotationBadge
                        key={`${overlay.id}-${attachment.labelZh}`}
                        attachment={attachment}
                        accent={overlay.accent}
                        sourceCite={overlay.source.noteZh || overlay.source.title}
                        isTraining={overlay.role === 'training'}
                        selected={selectedId === attachment.moduleId}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className={`block-shell__title ${selectedId === block.id ? 'is-selected' : ''}`}
                  onClick={() => onSelect(block.id)}
                  aria-pressed={selectedId === block.id}
                >
                  <span className="node-card__base-tag">基线</span>
                  <span className="node-card__name">{block.nameZh}</span>
                  <span className="node-card__en">{block.nameEn}</span>
                </button>

                <div className="block-inner">
                  <div className="node-slot node-slot--attn">
                    {attnBadges.length > 0 && (
                      <div className="anno-row anno-row--above">
                        {attnBadges.map(({ overlay, attachment }) => (
                          <AnnotationBadge
                            key={`${overlay.id}-${attachment.labelZh}`}
                            attachment={attachment}
                            accent={overlay.accent}
                            sourceCite={overlay.source.noteZh || overlay.source.title}
                            isTraining={overlay.role === 'training'}
                            selected={selectedId === attachment.moduleId}
                            onSelect={onSelect}
                          />
                        ))}
                      </div>
                    )}
                    <NodeCard
                      module={attention}
                      selected={selectedId === attention.id}
                      highlighted={highlightedIds.has(attention.id)}
                      onSelect={onSelect}
                      size="sm"
                      baselineTag
                    />
                    {attnLoops.map(({ overlay, attachment }) => (
                      <button
                        key={overlay.id}
                        type="button"
                        className={`kv-loop ${selectedId === attachment.moduleId ? 'is-selected' : ''}`}
                        style={{ '--layer-accent': overlay.accent } as CSSProperties}
                        onClick={() => onSelect(attachment.moduleId)}
                        title="推理期路径 · 非训练结构层"
                      >
                        <span className="kv-loop__path" aria-hidden />
                        <span className="kv-loop__label">
                          <em>推理期</em> {attachment.labelZh}
                        </span>
                      </button>
                    ))}
                  </div>

                  <span className="block-flow-arrow" aria-hidden>
                    →
                  </span>

                  <div className="node-slot">
                    {ffnBadges.length > 0 && (
                      <div className="anno-row anno-row--above">
                        {ffnBadges.map(({ overlay, attachment }) => (
                          <AnnotationBadge
                            key={`${overlay.id}-${attachment.labelZh}`}
                            attachment={attachment}
                            accent={overlay.accent}
                            sourceCite={overlay.source.noteZh || overlay.source.title}
                            isTraining={overlay.role === 'training'}
                            selected={selectedId === attachment.moduleId}
                            onSelect={onSelect}
                          />
                        ))}
                      </div>
                    )}
                    <NodeCard
                      module={ffn}
                      selected={selectedId === ffn.id}
                      highlighted={highlightedIds.has(ffn.id)}
                      onSelect={onSelect}
                      size="sm"
                      baselineTag={!moeOn}
                    />
                    {moeOn && (
                      <span className="replace-hint" title="MoE 通常替代稠密 FFN">
                        开 MoE 时：稠密 FFN 常被替代
                      </span>
                    )}
                  </div>

                  <span className="block-flow-arrow" aria-hidden>
                    →
                  </span>

                  <div className="node-slot">
                    {normBadges.length > 0 && (
                      <div className="anno-row anno-row--above">
                        {normBadges.map(({ overlay, attachment }) => (
                          <AnnotationBadge
                            key={`${overlay.id}-${attachment.labelZh}`}
                            attachment={attachment}
                            accent={overlay.accent}
                            sourceCite={overlay.source.noteZh || overlay.source.title}
                            isTraining={overlay.role === 'training'}
                            selected={selectedId === attachment.moduleId}
                            onSelect={onSelect}
                          />
                        ))}
                      </div>
                    )}
                    <NodeCard
                      module={norm}
                      selected={selectedId === norm.id}
                      highlighted={highlightedIds.has(norm.id)}
                      onSelect={onSelect}
                      size="sm"
                      baselineTag
                    />
                  </div>
                </div>

                <p className="block-order-hint muted">
                  Block 内顺序（教学示意）：自注意力 → 前馈 → 归一化/残差
                </p>

                {trainingView && (
                  <span
                    className="attach-port attach-port--bottom attach-port--block"
                    data-train-port="block-out"
                    aria-hidden
                  />
                )}
              </div>
            </li>

            <li className="pipeline-flow__connector pipeline-flow__col--a3" aria-hidden>
              <FlowArrow label="隐状态" />
            </li>

            <li className="pipeline-flow__step pipeline-flow__col--lm pipeline-flow__anchor pipeline-flow__anchor--lmhead">
              <div className="node-slot">
                <NodeCard
                  module={lmHead}
                  selected={selectedId === lmHead.id}
                  highlighted={highlightedIds.has(lmHead.id)}
                  onSelect={onSelect}
                  baselineTag
                  attachPort={trainingView ? 'bottom' : undefined}
                  portId={trainingView ? 'lm-out' : undefined}
                />
              </div>
            </li>

            <li className="pipeline-flow__connector pipeline-flow__col--a4" aria-hidden>
              <FlowArrow label="采样" />
            </li>

            <li className="pipeline-flow__step pipeline-flow__col--decode">
              <div className="node-slot">
                <NodeCard
                  module={sampling}
                  selected={selectedId === sampling.id}
                  highlighted={highlightedIds.has(sampling.id)}
                  onSelect={onSelect}
                  baselineTag
                />
              </div>
            </li>

            <li className="pipeline-flow__connector pipeline-flow__col--a5" aria-hidden>
              <FlowArrow label="文本" />
            </li>

            <li className="pipeline-flow__step pipeline-flow__col--output">
              <div className="node-slot">
                <NodeCard
                  module={outputText}
                  selected={selectedId === outputText.id}
                  highlighted={highlightedIds.has(outputText.id)}
                  onSelect={onSelect}
                  baselineTag
                />
              </div>
            </li>
          </ol>

          {trainingView && (
            <>
              {/* Vertical room for SVG elbows; stems are drawn by overlay */}
              <div className="train-bridge-gap" aria-hidden />
              <BackpropLane selectedId={selectedId} onSelect={onSelect} activeOverlays={activeOverlays} />
              <TrainBridgeOverlay stackRef={stackRef} enabled={trainingView} />
            </>
          )}
        </div>
      </div>

      <p className="pipeline-hint muted">
        点击模块打开详情 · 徽章「可选 / 替代 / 推理期 / 训练期」= 叠加层挂点，非必装清单
        {trainingView
          ? ' · 「训练期」橙线为端口折线路由 · 采样与输出文本仍为推理支路'
          : ''}
      </p>
    </div>
  )
}
