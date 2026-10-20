import type { ModuleNode } from '../types/architecture'

/**
 * Canonical decoder-only Transformer pipeline modules.
 * Shapes use common notation: B=batch, T=seq len, d=d_model, V=vocab.
 */
export const MODULES: Record<string, ModuleNode> = {
  tokens: {
    id: 'tokens',
    nameZh: '输入 Token',
    nameEn: 'Tokens / Input IDs',
    summaryZh:
      '把文本切成子词（tokenizer），得到整数 ID 序列。这是整条流水线的入口，本身不算「网络层」，但决定了序列长度 T 和词表大小 V。',
    formulaText: 'x = [t₁, t₂, …, t_T] ∈ {0…V-1}^T',
    formula: 'x = [t_1, t_2, \\ldots, t_T] \\in \\{0,\\ldots,V-1\\}^{T}',
    inputs: [{ shape: '文本 / 字节流', label: '原始输入' }],
    outputs: [{ shape: '[B, T]', label: 'token id' }],
    bulletsZh: [
      'BPE / SentencePiece 等分词决定词表 V',
      '特殊 token（BOS/EOS/PAD）会影响注意力掩码',
    ],
  },
  embedding: {
    id: 'embedding',
    nameZh: '词嵌入 + 位置编码',
    nameEn: 'Embedding + Position',
    summaryZh:
      '把每个 token id 映射成 d_model 维向量，再叠上位置信息，让模型知道「谁在前、谁在后」。现代模型多用 RoPE 等相对位置方案，而不是早期的绝对正弦位置表。',
    formula: 'h_0 = E_{\\text{tok}}(x) + \\text{Pos}(\\cdot)',
    formulaText: 'h₀ = E_tok(x) + Pos(·)',
    inputs: [{ shape: '[B, T]', label: 'token id' }],
    outputs: [{ shape: '[B, T, d_model]', label: '隐藏状态' }],
    bulletsZh: [
      'Embedding 矩阵形状约 [V, d_model]',
      '绝对 PE：加在 embedding 上；RoPE：旋在 Q/K 上（见叠加层）',
      '有的模型把 embedding 与 LM Head 权重共享（tied weights）',
    ],
    refs: [
      { title: 'Attention Is All You Need', year: 2017 },
      { title: 'RoPE (Su et al.)', year: 2021 },
    ],
  },
  block: {
    id: 'block',
    nameZh: 'Transformer Block × N',
    nameEn: 'Transformer Block',
    summaryZh:
      '主干重复 N 次。每个 block 通常含：归一化 → 自注意力 → 残差 → 归一化 → FFN → 残差。Pre-Norm（先 Norm 再子层）是现代 LLM 的主流写法。',
    formula: 'h_{\\ell+1} = h_\\ell + \\mathrm{FFN}(\\mathrm{Attn}(h_\\ell))',
    formulaText: 'h_{ℓ+1} = h_ℓ + FFN(Attn(h_ℓ))  （示意，含 Norm/残差）',
    inputs: [{ shape: '[B, T, d_model]', label: '上一层隐状态' }],
    outputs: [{ shape: '[B, T, d_model]', label: '下一层隐状态' }],
    bulletsZh: [
      'N 常见范围：十来层到上百层',
      '残差连接保证梯度通路',
      '图上 Block 内按教学顺序横排：Attention → FFN → Norm/残差',
      '现代 Pre-Norm 实现常是 Norm→Attn→残差→Norm→FFN→残差；点模块看细节',
    ],
  },
  attention: {
    id: 'attention',
    nameZh: '自注意力 (Self-Attention)',
    nameEn: 'Multi-Head Self-Attention',
    summaryZh:
      '每个位置从同一隐状态投影出 Query / Key / Value：用 Q 去匹配其它位置的 K，得到注意力权重后再对 V 加权求和。解码器语言模型加因果掩码，使位置 t 只能看见 ≤t 的 token，从而能自回归「一个词一个词」生成。',
    formula:
      '\\mathrm{Attn}(Q,K,V)=\\mathrm{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}}+M\\right)V',
    formulaText: 'Attn(Q,K,V) = softmax(QK^T/√d_k + M) V',
    inputs: [
      { shape: '[B, T, d_model]', label: '隐状态' },
      { shape: '[T, T] 或因果掩码', label: '掩码 M' },
    ],
    outputs: [{ shape: '[B, T, d_model]', label: '注意力输出' }],
    bulletsZh: [
      'Q、K、V：三条线性投影 W_Q / W_K / W_V，把同一 h 映射到查询、键、值空间',
      '缩放点积：除以 √d_k，避免点积过大导致 softmax 过锐',
      '因果掩码 M：把「未来」位置设为 −∞，softmax 后权重为 0',
      '多头：d_model 拆成 h 个头并行，再拼接并用 W_O 投影回 d_model',
      'GQA/MQA：减少 K/V 头数以省 KV Cache——请打开叠加层「MQA / GQA」查看（可选替代，非必装）',
      '推理时可缓存历史 K/V（见「KV Cache」叠加层）',
    ],
    detailSections: [
      {
        id: 'qkv',
        titleZh: 'Q / K / V 投影',
        badgeZh: '核心',
        bodyZh:
          '对每个位置的隐状态 h，用三个可学习矩阵得到 q=hW_Q、k=hW_K、v=hW_V。注意力分数来自 q 与各位置 k 的点积；输出是对 v 的加权和。自注意力里 Q/K/V 都来自同一序列（可再加 RoPE 等位置方案，见叠加层）。',
        formula: 'q=hW_Q,\\; k=hW_K,\\; v=hW_V',
        formulaText: 'q = h W_Q，k = h W_K，v = h W_V',
      },
      {
        id: 'causal',
        titleZh: '因果掩码',
        badgeZh: '自回归',
        bodyZh:
          '训练与推理解码时，位置 t 不得「偷看」t+1…T 的 token。实现上通常在注意力 logits 上对严格上三角（未来）加 −∞，再 softmax。这与双向编码器（如纯 BERT 式）不同。',
        formula: 'M_{ij}=0\\ (j\\le i);\\quad M_{ij}=-\\infty\\ (j>i)',
        formulaText: 'M_ij = 0 (j≤i)；−∞ (j>i)',
      },
      {
        id: 'mha_gqa',
        titleZh: '多头与 GQA',
        badgeZh: '变体',
        bodyZh:
          '标准多头（MHA）每个头有独立的 Q/K/V。GQA/MQA 让多组查询头共享同一组 K/V，显著减小推理 KV Cache，质量损失通常可控。本图基线画的是概念上的「注意力」；具体头配置请用叠加层对比，勿理解为必须同时打开。',
        bulletsZh: [
          '打开顶部「MQA / GQA」叠加层，可在 Attention 节点旁看到替代标注',
          '与「KV Cache」叠加层组合时，显存收益更直观（公开共识）',
        ],
      },
    ],
    refs: [
      { title: 'Attention Is All You Need', year: 2017 },
      { title: 'GQA (Ainslie et al.)', year: 2023 },
    ],
  },
  ffn: {
    id: 'ffn',
    nameZh: '前馈网络 (FFN)',
    nameEn: 'Feed-Forward Network',
    summaryZh:
      '对每个位置独立做两层（或带门控的）全连接变换，负责「按位置」的非线性特征混合。宽度通常是 d_model 的若干倍（如 4×），参数量往往比注意力还大。',
    formula: '\\mathrm{FFN}(x)=W_2\\,\\sigma(W_1 x)',
    formulaText: 'FFN(x) = W₂ σ(W₁ x)  （或 SwiGLU 等门控形式）',
    inputs: [{ shape: '[B, T, d_model]', label: '注意力后的隐状态' }],
    outputs: [{ shape: '[B, T, d_model]', label: 'FFN 输出' }],
    bulletsZh: [
      'GELU / SiLU / SwiGLU 是常见激活',
      'MoE 变体把这一层换成「多个专家 + 路由」',
      '中间维度 d_ff 是算力与显存的大头之一',
    ],
  },
  norm: {
    id: 'norm',
    nameZh: '归一化 + 残差',
    nameEn: 'Norm & Residual',
    summaryZh:
      'LayerNorm / RMSNorm 稳定激活尺度；残差把子层输出加回输入。现代 LLM 多用 Pre-Norm + RMSNorm，训练更稳、实现更简单。',
    formula: 'y = x + \\mathrm{SubLayer}(\\mathrm{RMSNorm}(x))',
    formulaText: 'y = x + SubLayer(RMSNorm(x))',
    inputs: [{ shape: '[B, T, d_model]', label: '子层输入' }],
    outputs: [{ shape: '[B, T, d_model]', label: '残差后输出' }],
    bulletsZh: [
      'RMSNorm 不算均值，只做均方根缩放',
      '残差是深网络能堆起来的关键',
    ],
  },
  lm_head: {
    id: 'lm_head',
    nameZh: '语言模型头 (LM Head)',
    nameEn: 'LM Head / Logits',
    summaryZh:
      '把最后一层隐状态投影到词表维度，得到每个位置、每个词的未归一化分数（logits）。训练时对正确下一个 token 做交叉熵；推理时再采样或取 argmax。',
    formula: 'z = h_N W_{\\mathrm{LM}}^\\top \\in \\mathbb{R}^{B\\times T\\times V}',
    formulaText: 'z = h_N W_LMᵀ ∈ ℝ^{B×T×V}',
    inputs: [{ shape: '[B, T, d_model]', label: '最终隐状态' }],
    outputs: [{ shape: '[B, T, V]', label: 'logits' }],
    bulletsZh: [
      '常与 token embedding 权重绑定（weight tying）',
      '生成时通常只看最后一个位置的 logits',
    ],
  },
  sampling: {
    id: 'sampling',
    nameZh: '采样 / 解码',
    nameEn: 'Sampling / Decode',
    summaryZh:
      '推理期步骤：把 LM Head 的 logits 变成下一个 token id。常见策略有 greedy（取最大）、top-k（只在概率最高的 k 个里采样）、top-p / nucleus（累计概率达到 p 的最小集合里采样）。训练主路径不走这里，而是 logits 与标签直接算交叉熵 Loss。',
    formula: 't_{T+1}=\\mathrm{Decode}\\big(\\mathrm{softmax}(z_T/\\tau)\\big)',
    formulaText: 't_{T+1} = Decode(softmax(z_T / τ))  （greedy / top-k / top-p）',
    inputs: [{ shape: '[B, T, V] 或 [B, V]', label: 'logits' }],
    outputs: [{ shape: '[B] 或 [B, k]', label: 'next token id(s)' }],
    bulletsZh: [
      '温度 τ：>1 更平滑（更随机），→0 接近 greedy',
      '仅生成文本时需要；与训练期 Loss 是 LM Head 之后的两条分叉',
      '可与重复惩罚、停用词等后处理组合（实现相关，此处从略）',
    ],
    detailSections: [
      {
        id: 'greedy',
        titleZh: 'Greedy（贪心）',
        badgeZh: '确定',
        bodyZh:
          '对词表维取 argmax：每次选概率最高的 token。实现简单、可复现，但多样性差，长文本易刻板或循环。',
        formula: 't^*=\\arg\\max_i\\,\\mathrm{softmax}(z)_i',
        formulaText: 't* = argmax_i softmax(z)_i',
      },
      {
        id: 'topk',
        titleZh: 'Top-k',
        badgeZh: '截断',
        bodyZh:
          '只保留概率最高的 k 个词，其余置零并重新归一化，再按该分布采样。k 小更稳、更「保守」；k 大更接近全词表采样。',
        formula: "p'\\propto p\\cdot 1[i\\in TopK(p)]",
        formulaText: "p' ∝ p · 1[i ∈ TopK(p)]",
      },
      {
        id: 'topp',
        titleZh: 'Top-p（Nucleus）',
        badgeZh: '自适应',
        bodyZh:
          '按概率从高到低累积，取刚好使累计质量 ≥ p 的最小集合（核），再在该集合内采样。比固定 k 更能随分布形状伸缩：峰值尖时候选少，平坦时候选多。',
        formula: 'V_p=\\min\\{S:\\sum_{i\\in S}p_i\\ge p\\}',
        formulaText: 'V_p = 累计概率 ≥ p 的最小高概率集合',
      },
    ],
  },
  output_text: {
    id: 'output_text',
    nameZh: '输出文本',
    nameEn: 'Output Text / Detokenize',
    summaryZh:
      '把采样得到的 token id 序列经 tokenizer 的 detokenize / decode 还原成可读文本（或流式拼出增量字符串）。这是用户看到的最终「回答」，属于推理输出，不是训练结构层。',
    formula: '\\mathrm{text}=\\mathrm{detokenize}([t_1,\\ldots,t_{T\'}])',
    formulaText: 'text = detokenize([t₁, …, t_T′])',
    inputs: [{ shape: 'token id 序列', label: '生成的 ids' }],
    outputs: [{ shape: '字符串', label: '可读文本' }],
    bulletsZh: [
      '与分词器词表一一对应；特殊 token 常在展示前剥离',
      '流式生成时可边采样边 detokenize 增量输出',
      '训练评估有时也 decode 看样例，但不改变 Loss 主路径',
    ],
  },
  // Extra modules used by variants

  csa_hca_attention: {
    id: 'csa_hca_attention',
    nameZh: 'CSA / HCA 混合注意力',
    nameEn: 'Compressed Sparse / Heavily Compressed Attention',
    summaryZh:
      'DeepSeek-V4 公开预览报告中的长上下文注意力：CSA（序列维压缩 KV 后再做稀疏注意力）与 HCA（更强压缩但保持稠密注意力）按层混合，用以降低百万级上下文下的 KV 与算力，替代 V2/V3 的 MLA 路线。此处只标高层位置，细节以官方报告为准。',
    formula: '\\mathrm{Attn}_{\\mathrm{V4}}\\approx\\mathrm{Hybrid}(\\mathrm{CSA},\\mathrm{HCA})',
    formulaText: 'Attn_V4 ≈ Hybrid(CSA, HCA)  （按层交替/配置，示意）',
    inputs: [{ shape: '[B, T, d_model]', label: '隐状态' }],
    outputs: [{ shape: '[B, T, d_model]', label: '注意力输出' }],
    bulletsZh: [
      '挂在 Attention：替代 MLA / 标准 MHA 的长上下文方案',
      '公开称可支撑约 1M token 上下文（以模型卡为准）',
      'Muon 属训练优化器，不是本结构层',
    ],
    refs: [
      {
        title: 'DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence',
        year: 2026,
        url: 'https://arxiv.org/abs/2606.19348',
      },
    ],
  },
  mhc_residual: {
    id: 'mhc_residual',
    nameZh: 'mHC 超连接',
    nameEn: 'Manifold-Constrained Hyper-Connections',
    summaryZh:
      'DeepSeek-V4 用 Manifold-Constrained Hyper-Connections（mHC）增强传统残差：多流通路并在流之间做受约束混合，而不是单一残差累加。叠在 Norm/残差节点上表示「残差通路的升级」，不是新的并行主干。',
    formula: 'h\\leftarrow\\mathrm{mHC}(h,\\{\\mathrm{streams}\\})',
    formulaText: 'h ← mHC(h, streams)  （流扩展 + 流形约束混合，示意）',
    inputs: [{ shape: '[B, T, d_model]', label: '层输入/残差流' }],
    outputs: [{ shape: '[B, T, d_model]', label: '混合后状态' }],
    bulletsZh: [
      '相对 plain residual：加深信息流通，仍挂在基线 Norm+残差概念上',
      '细节（流数、Sinkhorn 等）见公开 V4 报告',
    ],
    refs: [
      {
        title: 'DeepSeek-V4 technical report (mHC section)',
        year: 2026,
        url: 'https://arxiv.org/abs/2606.19348',
      },
    ],
  },
  partial_rope: {
    id: 'partial_rope',
    nameZh: 'Partial RoPE',
    nameEn: 'Partial Rotary Position Embedding',
    summaryZh:
      'DeepSeek-V4 公开描述对注意力相关向量的末若干维施加 RoPE（含对注意力输出的逆位置旋转等变体），称为 Partial RoPE，以配合 CSA/HCA 长上下文。挂在 Embedding/Attention 旁，表示位置编码的细化，而非另起一条位置支路蜘蛛网。',
    formula: '\\mathrm{RoPE}_{\\mathrm{partial}}(x)=\\mathrm{RoPE}(x_{[:d_r]})\\,\\|\\,x_{[d_r:]}',
    formulaText: '仅对末 d_r 维做 RoPE（示意；维数以报告为准）',
    inputs: [{ shape: 'Q/K/…', label: '待旋转向量' }],
    outputs: [{ shape: '同形', label: '部分旋转后' }],
    bulletsZh: [
      '与「全维 RoPE」叠加层可对照；V4 包打开本层以强调 Partial',
      '长上下文（公开约 1M）与 CSA/HCA 配套出现',
    ],
    refs: [
      {
        title: 'DeepSeek-V4 technical report',
        year: 2026,
        url: 'https://arxiv.org/abs/2606.19348',
      },
    ],
  },
  kda_attention: {
    id: 'kda_attention',
    nameZh: 'KDA 注意力',
    nameEn: 'Kimi Delta Attention',
    summaryZh:
      'Kimi K3 公开架构中的 Kimi Delta Attention（KDA）：偏线性/高效率的长序列混合，与周期性插入的 Gated MLA 组成 3:1 混合注意力块。挂在 Attention 上表示 K3 的主注意力形态之一。',
    formula: '\\mathrm{Block}:\\ 3\\times\\mathrm{KDA}+1\\times\\mathrm{GatedMLA}',
    formulaText: '每块 3×KDA + 1×Gated MLA（公开 3:1 配比，示意）',
    inputs: [{ shape: '[B, T, d_model]', label: '隐状态' }],
    outputs: [{ shape: '[B, T, d_model]', label: '注意力输出' }],
    bulletsZh: [
      '与 Gated MLA 交替：效率路径 + 全局交互路径',
      '公开支持约 1M 上下文；细节见 K3 技术报告 / GitHub',
    ],
    refs: [
      {
        title: 'Kimi K3: Open Frontier Intelligence',
        year: 2026,
        url: 'https://arxiv.org/abs/2607.24653',
      },
      {
        title: 'MoonshotAI/Kimi-K3',
        year: 2026,
        url: 'https://github.com/MoonshotAI/Kimi-K3',
      },
    ],
  },
  attn_res: {
    id: 'attn_res',
    nameZh: 'AttnRes 残差',
    nameEn: 'Attention Residuals',
    summaryZh:
      'Kimi K3 的 Attention Residuals（AttnRes）：让当前层可选择性地从嵌入与更早层的表示中「取回」信息，而不是只做逐层累加残差。叠在 Norm/残差概念上，强调深度方向的信息通路升级。',
    formula: 'h_\\ell\\leftarrow h_\\ell+\\mathrm{AttnRes}(\\{h_{<\\ell},e\\})',
    formulaText: 'h_ℓ ← h_ℓ + AttnRes({更早层, embedding})  （示意）',
    inputs: [{ shape: '多层隐状态', label: '历史表示' }],
    outputs: [{ shape: '[B, T, d_model]', label: '检索混合后' }],
    bulletsZh: [
      '相对 plain residual：深度维可选择访问',
      '与 KDA/Gated MLA、LatentMoE 同属 K3 公开骨架',
    ],
    refs: [
      {
        title: 'Kimi K3 technical report (AttnRes)',
        year: 2026,
        url: 'https://arxiv.org/abs/2607.24653',
      },
    ],
  },
  situ_glu: {
    id: 'situ_glu',
    nameZh: 'SiTU-GLU',
    nameEn: 'SiTU-GLU Activation',
    summaryZh:
      'Kimi K3 公开使用的门控激活 SiTU-GLU，用于在极端稀疏 MoE 下约束激活增长、稳定训练。挂在 FFN 上，表示相对 SwiGLU 的一种公开激活选型。',
    formula: '\\mathrm{SiTU\\text{-}GLU}(x)=\\mathrm{Gate}(x)\\odot\\mathrm{SiTU}(x)',
    formulaText: 'SiTU-GLU：门控 × SiTU 支路（示意，以公开实现为准）',
    inputs: [{ shape: '[B, T, d]', label: 'FFN/专家输入' }],
    outputs: [{ shape: '[B, T, d]', label: '激活后' }],
    bulletsZh: [
      'K3 模型卡写明 Activation = SiTU-GLU',
      '与 LatentMoE / 专家路由一起出现在公开配方中',
    ],
    refs: [
      {
        title: 'MoonshotAI/Kimi-K3 model summary',
        year: 2026,
        url: 'https://github.com/MoonshotAI/Kimi-K3',
      },
    ],
  },
  latent_moe: {
    id: 'latent_moe',
    nameZh: 'LatentMoE',
    nameEn: 'Stable LatentMoE',
    summaryZh:
      'Kimi K3 的 Stable LatentMoE：路由专家在更窄的潜在宽度上计算，以扩大专家池（公开如 896 选 16）同时控制通信与算力；共享专家仍走全宽路径。挂在 FFN 上，作为 MoE 的一种公开稀疏形态（相对通用 MoE 徽章更贴 K3）。',
    formula: 'y=\\mathrm{Shared}(x)+\\mathrm{Up}\\big(\\sum_{i\\in\\mathrm{TopK}} g_i E_i^{(\\ell)}(\\mathrm{Down}(x))\\big)',
    formulaText: '共享全宽 + 潜在宽度路由专家（示意）',
    inputs: [{ shape: '[B, T, d_model]', label: '隐状态' }],
    outputs: [{ shape: '[B, T, d_model]', label: '稀疏 FFN 输出' }],
    bulletsZh: [
      '公开：约 16/896 路由专家 + 共享专家',
      '与基线「MoE」叠加可对照；K3 包优先打开本层',
    ],
    refs: [
      {
        title: 'Kimi K3: Open Frontier Intelligence',
        year: 2026,
        url: 'https://arxiv.org/abs/2607.24653',
      },
    ],
  },
    // —— Open-model variant detail modules (fused via overlays) ——
  swiglu_ffn: {
    id: 'swiglu_ffn',
    nameZh: 'SwiGLU FFN',
    nameEn: 'SwiGLU Feed-Forward',
    summaryZh:
      '门控式前馈：用 SiLU/Swish 激活的一支与线性支相乘（GLU 结构），再投影回 d_model。Llama / Qwen / Mistral 等公开模型广泛采用，作为稠密 FFN 的一种具体激活选型，而不是多出来的并行层。',
    formula: '\\mathrm{SwiGLU}(x)=(W_1 x\\odot\\mathrm{SiLU}(W_g x))W_2',
    formulaText: 'SwiGLU(x) = (W₁x ⊙ SiLU(W_g x)) W₂',
    inputs: [{ shape: '[B, T, d_model]', label: 'Norm 后隐状态' }],
    outputs: [{ shape: '[B, T, d_model]', label: 'FFN 输出' }],
    bulletsZh: [
      '相对 ReLU/GELU MLP：多一条门控投影，表达力与算力都有公开讨论',
      '叠在基线「FFN」上显示为替代激活形态',
    ],
    refs: [{ title: 'GLU Variants Improve Transformer (Shazeer)', year: 2020 }],
  },
  rmsnorm_prenorm: {
    id: 'rmsnorm_prenorm',
    nameZh: 'RMSNorm + Pre-Norm',
    nameEn: 'RMSNorm (Pre-Norm)',
    summaryZh:
      '用 RMSNorm（均方根归一化，不算均值）稳定激活，并放在子层之前（Pre-Norm）。Llama / Qwen / Mistral / DeepSeek 等公开 Decoder 配方里极为常见；本图基线已示意 Norm+残差，此模块强调「RMS + Pre」这一公开主流选法。',
    formula: '\\mathrm{RMSNorm}(x)=\\frac{x}{\\sqrt{\\mathrm{mean}(x^2)+\\epsilon}}\\odot\\gamma',
    formulaText: 'RMSNorm(x) = x / √(mean(x²)+ε) ⊙ γ',
    inputs: [{ shape: '[B, T, d_model]', label: '子层输入' }],
    outputs: [{ shape: '[B, T, d_model]', label: '归一化后' }],
    bulletsZh: [
      'Pre-Norm：y = x + SubLayer(RMSNorm(x))',
      '许多公开实现中线性层无 bias（与 Norm 选型常一起出现，因模型而异）',
    ],
    refs: [{ title: 'Root Mean Square Layer Normalization', year: 2019 }],
  },
  mla_attention: {
    id: 'mla_attention',
    nameZh: 'MLA 注意力',
    nameEn: 'Multi-head Latent Attention',
    summaryZh:
      'DeepSeek-V2/V3 公开技术报告中的注意力变体：通过低秩/潜在压缩降低 KV 缓存与带宽，同时保持多头表达。叠在基线 Attention 上表示「用 MLA 替代标准 MHA/GQA 布局」，细节以官方报告为准，此处只给高层数据流位置。',
    formula: 'c^{KV}=W^{DKV}h,\\;\\; K,V=\\mathrm{Up}(c^{KV})',
    formulaText: '压缩隐状态得潜在 KV，再上投影——示意，以 DeepSeek 公开报告为准',
    inputs: [{ shape: '[B, T, d_model]', label: '隐状态' }],
    outputs: [{ shape: '[B, T, d_model]', label: '注意力输出' }],
    bulletsZh: [
      '挂在 Attention：替代标准多头 KV 存储方式',
      '常与 DeepSeekMoE 等一起出现在公开 V2/V3 描述中',
      '不在此复刻未公开内核实现',
    ],
    refs: [
      {
        title: 'DeepSeek-V2 Technical Report (public)',
        year: 2024,
        url: 'https://arxiv.org/abs/2405.04434',
      },
    ],
  },
  sliding_window_attn: {
    id: 'sliding_window_attn',
    nameZh: '滑动窗口注意力',
    nameEn: 'Sliding Window Attention',
    summaryZh:
      'Mistral 7B 等公开模型采用的局部注意力窗口：每个 token 主要只看最近 W 个位置（可叠分层间传递扩大感受野）。相对「全局因果注意力」是一种效率向的掩码改写，不是另画一条并行注意力蜘蛛网。',
    formula: 'M_{ij}=-\\infty\\ \\mathrm{if}\\ j<i-W\\ \\mathrm{or}\\ j>i',
    formulaText: '仅允许 j ∈ [i−W, i]（因果滑动窗口，示意）',
    inputs: [
      { shape: '[B, T, d_model]', label: '隐状态' },
      { shape: '窗口 W', label: '公开配置' },
    ],
    outputs: [{ shape: '[B, T, d_model]', label: '注意力输出' }],
    bulletsZh: [
      '挂在 Attention：改写可见范围 / 掩码',
      '与 GQA、SwiGLU、RMSNorm 等可组合（Mistral 公开配方）',
    ],
    refs: [
      {
        title: 'Mistral 7B (public paper)',
        year: 2023,
        url: 'https://arxiv.org/abs/2310.06825',
      },
    ],
  },
    moe_ffn: {
    id: 'moe_ffn',
    nameZh: 'MoE 专家层',
    nameEn: 'Mixture-of-Experts FFN',
    summaryZh:
      '用路由器（gate）为每个 token 选出少数专家 FFN 来计算。总参数可以很大，但每次只激活一部分，从而在相近算力下扩大容量。',
    formula: 'y=\\sum_{i\\in\\mathrm{TopK}} g_i(x)\\,E_i(x)',
    formulaText: 'y = Σ_{i∈TopK} g_i(x) E_i(x)',
    inputs: [{ shape: '[B, T, d_model]', label: 'Norm 后隐状态' }],
    outputs: [{ shape: '[B, T, d_model]', label: '稀疏 FFN 输出' }],
    bulletsZh: [
      '专家数 E、每次激活 K 是关键超参',
      '负载均衡损失防止个别专家过热',
      '通信与路由是系统工程难点',
    ],
    refs: [
      { title: 'Switch Transformer', year: 2021 },
      { title: 'Mixtral / DeepSeek-MoE reports (public)', year: 2024 },
    ],
  },
  mqa_gqa: {
    id: 'mqa_gqa',
    nameZh: 'MQA / GQA 注意力',
    nameEn: 'Multi/Grouped-Query Attention',
    summaryZh:
      '减少 K/V 头数量：MQA 全共享一组 K/V；GQA 把查询头分组共享 K/V。推理时 KV cache 更小、更省带宽，质量损失通常可控。',
    formula: 'n_{\\mathrm{kv}} \\ll n_{\\mathrm{q}}\\quad(\\mathrm{GQA/MQA})',
    formulaText: 'n_kv ≪ n_q （GQA/MQA）',
    inputs: [{ shape: '[B, T, d_model]', label: '隐状态' }],
    outputs: [{ shape: '[B, T, d_model]', label: '注意力输出' }],
    bulletsZh: [
      'Llama 2/3 等公开模型广泛使用 GQA',
      '主要收益在推理显存与吞吐，而非训练理论',
    ],
    refs: [
      { title: 'MQA (Shazeer)', year: 2019 },
      { title: 'GQA (Ainslie et al.)', year: 2023 },
    ],
  },
  rope: {
    id: 'rope',
    nameZh: 'RoPE 位置编码',
    nameEn: 'Rotary Position Embedding',
    summaryZh:
      '不对 embedding 做加法，而是在 Q/K 上按位置做二维旋转，使注意力天然带相对位置信息，外推到更长上下文时往往更稳。',
    formula: 'q_m^\\top k_n = (R_m q)^\\top (R_n k)',
    formulaText: 'q_mᵀ k_n = (R_m q)ᵀ (R_n k)',
    inputs: [
      { shape: '[B, h, T, d_k]', label: 'Q / K' },
      { shape: '位置 m, n', label: '下标' },
    ],
    outputs: [{ shape: '[B, h, T, d_k]', label: '旋转后的 Q / K' }],
    bulletsZh: [
      '已是开源 LLM 的事实标准之一',
      '长上下文还有 YaRN、NTK-aware 等外推技巧（公开论文）',
    ],
    refs: [{ title: 'RoFormer / RoPE (Su et al.)', year: 2021 }],
  },
  vision_encoder: {
    id: 'vision_encoder',
    nameZh: '视觉编码器',
    nameEn: 'Vision Encoder',
    summaryZh:
      '多模态模型先把图像切成 patch，经 ViT 等编码器得到视觉 token，再投影到 LLM 的隐空间，与文本 token 一起送进语言模型。此处只展示公开高层流程。',
    formula: 'v = W_{\\mathrm{proj}}\\,\\mathrm{Enc}_{\\mathrm{vis}}(\\mathrm{patches})',
    formulaText: 'v = W_proj Enc_vis(patches)',
    inputs: [{ shape: '[B, 3, H, W]', label: '图像' }],
    outputs: [{ shape: '[B, T_v, d_model]', label: '视觉 token' }],
    bulletsZh: [
      '连接方式：前缀拼接 / 交叉注意力等（因模型而异）',
      '细节以各模型公开技术报告为准',
    ],
    refs: [
      { title: 'LLaVA / Flamingo-style public reports', year: 2023 },
    ],
  },
  kv_cache: {
    id: 'kv_cache',
    nameZh: 'KV Cache（推理）',
    nameEn: 'KV Cache',
    summaryZh:
      '自回归生成时，历史位置的 K/V 已算过，可缓存复用，新 step 只算当前 token 的 Q 与新的 K/V。显著降低解码算力，但占用显存随上下文增长。',
    formula: 'K_{1:t}=[K_{1:t-1};k_t],\\; V_{1:t}=[V_{1:t-1};v_t]',
    formulaText: 'K_{1:t} = [K_{1:t-1}; k_t]，V 同理',
    inputs: [
      { shape: '[B, h_kv, t-1, d_k]', label: '历史 cache' },
      { shape: '[B, h_kv, 1, d_k]', label: '新 K/V' },
    ],
    outputs: [{ shape: '[B, h_kv, t, d_k]', label: '更新后 cache' }],
    bulletsZh: [
      'GQA/MQA 直接缩小 cache 体积',
      '分页注意力（PagedAttention）等是系统侧优化（公开资料）',
    ],
  },

  // —— Interview-term overlays (shared baseline hang points) ——
  yarn_ntk: {
    id: 'yarn_ntk',
    nameZh: 'YaRN / NTK-aware',
    nameEn: 'YaRN / NTK-aware RoPE scaling',
    summaryZh:
      '在已有 RoPE 之上的长上下文外推技巧（公开论文）：NTK-aware 插值 / YaRN 等通过调整旋转频率或插值，让模型在训练长度之外仍能稳住注意力。这是位置方案的增强选项，不是另画一条并行 Embedding 蜘蛛网。',
    formula: '\\theta_k^{\\mathrm{scaled}}=f_{\\mathrm{YaRN/NTK}}(\\theta_k, L, L^{\\prime})',
    formulaText: 'θ_k^scaled = f_YaRN/NTK(θ_k, L, L′)',
    inputs: [
      { shape: 'RoPE 频率', label: '基线 θ' },
      { shape: 'L → L′', label: '训练长 → 目标长' },
    ],
    outputs: [{ shape: '缩放后频率', label: '外推 RoPE' }],
    bulletsZh: [
      '挂在 Embedding / 位置：改 RoPE 频率或插值，不替换整条主干',
      '常与「先训短上下文、再外推」配方一起出现在公开报告中',
      '具体系数以各模型公开配置为准，此处只给概念',
    ],
    refs: [
      { title: 'YaRN (Peng et al.)', year: 2023, url: 'https://arxiv.org/abs/2309.00071' },
      { title: 'NTK-aware RoPE scaling (public notes)', year: 2023 },
    ],
  },
  qk_norm: {
    id: 'qk_norm',
    nameZh: 'QK-Norm',
    nameEn: 'Query-Key Normalization',
    summaryZh:
      '在注意力里对 Q 和/或 K 做归一化（如 RMSNorm），再算点积。公开讨论中用于稳住深层/大模型的注意力 logits。这是 Attention 内部的可选改写，不是并行多套注意力。',
    formula: '\\mathrm{Attn}(\\mathrm{Norm}(Q),\\mathrm{Norm}(K),V)',
    formulaText: 'Attn(Norm(Q), Norm(K), V)  （示意）',
    inputs: [{ shape: '[B, h, T, d_k]', label: 'Q / K' }],
    outputs: [{ shape: '[B, h, T, d_k]', label: '归一化后 Q / K' }],
    bulletsZh: [
      '挂在 Attention：点积前的稳定性技巧',
      '与 RoPE、GQA 等可组合；是否启用以公开模型卡为准',
    ],
    refs: [{ title: 'QK-Norm in public LLM training notes / papers', year: 2023 }],
  },
  flash_attn: {
    id: 'flash_attn',
    nameZh: 'FlashAttention',
    nameEn: 'FlashAttention',
    summaryZh:
      'IO 感知的精确注意力实现：分块计算 softmax，减少 HBM 读写，从而加速并省显存。数学上仍是同一套 Attention，不改变「QKᵀV」结构——属于实现/系统层优化，常在训练与推理内核中出现。',
    formula: '\\mathrm{Attn}(Q,K,V)=\\mathrm{FlashAttn}(Q,K,V)',
    formulaText: 'Attn(Q,K,V) = FlashAttn(Q,K,V)  （等价计算，不同 IO）',
    inputs: [{ shape: '[B, h, T, d]', label: 'Q / K / V' }],
    outputs: [{ shape: '[B, h, T, d]', label: '注意力输出' }],
    bulletsZh: [
      '挂在 Attention：同构图的高效核，不是新架构分支',
      '与 KV Cache、GQA 等正交；具体版本（FA2/FA3）以部署栈为准',
    ],
    refs: [
      { title: 'FlashAttention (Dao et al.)', year: 2022, url: 'https://arxiv.org/abs/2205.14135' },
    ],
  },
  paged_attn: {
    id: 'paged_attn',
    nameZh: 'PagedAttention',
    nameEn: 'PagedAttention (vLLM)',
    summaryZh:
      '推理服务侧管理 KV Cache 的分页内存：像操作系统分页一样按块分配/回收 cache，提高并发与显存利用率。它不改 Transformer 公式，而是改「KV 存在哪、怎么拼」——挂在 Attention / KV Cache 的推理期路径上。',
    formula: '\\mathrm{KV}=\\mathrm{page\\text{-}table}[\\mathrm{blocks}]',
    formulaText: 'KV = page-table[blocks]  （示意）',
    inputs: [{ shape: '逻辑序列 KV', label: '连续视图' }],
    outputs: [{ shape: '物理分页块', label: 'GPU 显存块' }],
    bulletsZh: [
      '推理期：服务框架（如 vLLM 公开论文）中的 cache 布局',
      '与「算子级 FlashAttention」互补：一个管算，一个管存',
    ],
    refs: [
      { title: 'Efficient Memory Management for LLM Serving (PagedAttention)', year: 2023, url: 'https://arxiv.org/abs/2309.06180' },
    ],
  },
  amp_precision: {
    id: 'amp_precision',
    nameZh: 'bf16 / fp16',
    nameEn: 'Mixed Precision (bf16/fp16)',
    summaryZh:
      '训练期混合精度：前向/反向上大量用 bf16 或 fp16 加速与省显存，关键归约（如 loss、部分累加）仍用更高精度。这不是网络结构层，而是 Opt/Autograd 旁的数值格式选择。',
    formula: '\\theta\\leftarrow\\mathrm{Opt}(\\theta,\\nabla^{\\mathrm{low\\text{-}p}}\\mathcal{L})',
    formulaText: '多数张量低精度计算，主权重/部分累加可保留更高精度',
    inputs: [{ shape: '激活 / 梯度', label: '低精度张量' }],
    outputs: [{ shape: '更新后 θ', label: '常仍存高精度主副本' }],
    bulletsZh: [
      '训练期徽章：挂在优化器 / 反传附近',
      'bf16 在近年 LLM 预训练中更常见；fp16 需留意 loss scaling',
      '推理也可低精度，但本开关强调训练配方语境',
    ],
    phase: 'training',
    refs: [{ title: 'Mixed-precision training (public framework docs)', year: 2018 }],
  },
  grad_accum: {
    id: 'grad_accum',
    nameZh: '梯度累积',
    nameEn: 'Gradient Accumulation',
    summaryZh:
      '显存不够一次大 batch 时：连续多个 micro-batch 只反传累加梯度，再执行一次 Opt.step()。有效 batch ≈ micro-batch × 累积步数。挂在「更新参数」旁，提醒 step 频率被拉开——不是新层。',
    formula: 'g\\leftarrow\\sum_{i=1}^{N}\\nabla\\mathcal{L}_i,\\quad \\theta\\leftarrow\\mathrm{Opt}(\\theta,g)',
    formulaText: 'g ← Σ_i ∇L_i（N 次 micro-batch），再 Opt.step',
    inputs: [{ shape: 'micro-batch×N', label: '累积窗口' }],
    outputs: [{ shape: '一次参数更新', label: '等效大 batch' }],
    bulletsZh: [
      '训练期：改写「多久调用一次优化器」',
      '与分布式（ZeRO/FSDP）常一起出现在公开配方中',
    ],
    phase: 'training',
  },
  act_checkpoint: {
    id: 'act_checkpoint',
    nameZh: '激活检查点',
    nameEn: 'Activation Checkpointing (Recompute)',
    summaryZh:
      '训练省显存技巧：前向不保留全部中间激活，反传时再重算一遍局部前向。用算力换显存。挂在 Autograd 旁——它改变的是「反传时图上保留什么」，不是推理架构。',
    formula: '\\mathrm{mem}\\downarrow\\ \\mathrm{by}\\ \\mathrm{recompute}(f)',
    formulaText: '存检查点、反传时重算 f 的局部前向',
    inputs: [{ shape: '检查点激活', label: '稀疏保存' }],
    outputs: [{ shape: '梯度', label: '重算后求得' }],
    bulletsZh: [
      '训练期：与 FlashAttention、ZeRO 等正交的显存手段',
      '推理一般不启用（无训练图）',
    ],
    phase: 'training',
    refs: [{ title: 'Gradient checkpointing (Chen et al. / framework docs)', year: 2016 }],
  },
  dist_parallel: {
    id: 'dist_parallel',
    nameZh: 'ZeRO / FSDP / TP·PP',
    nameEn: 'Distributed training parallelism',
    summaryZh:
      '多卡训练的并行与分片名词速记（公开资料）：ZeRO / FSDP 分片优化器状态与参数以省显存；张量并行（TP）切单层矩阵；流水线并行（PP）切层深。它们描述「参数与计算如何分布在设备上」，不是再画一条模型蜘蛛网。',
    formulaText: 'DP / ZeRO·FSDP（分片）· TP（切宽）· PP（切深）— 可组合',
    inputs: [{ shape: '模型 θ、梯度、优化器态', label: '全量逻辑视图' }],
    outputs: [{ shape: '分片后驻留', label: '各 GPU 本地切片' }],
    bulletsZh: [
      'ZeRO-1/2/3 与 FSDP：分片粒度不同，目标都是放大可训规模',
      'TP：层内矩阵按设备切；PP：层间流水；常与数据并行组合',
      '本叠加只给面试速记，不展开具体通信拓扑',
    ],
    phase: 'training',
    refs: [
      { title: 'ZeRO (Rajbhandari et al.)', year: 2020 },
      { title: 'PyTorch FSDP / Megatron-LM public docs', year: 2022 },
    ],
  },
  lora_qlora: {
    id: 'lora_qlora',
    nameZh: 'LoRA / QLoRA',
    nameEn: 'LoRA / QLoRA (PEFT)',
    summaryZh:
      '参数高效微调：在冻结的基座权重旁插入低秩适配矩阵（LoRA）；QLoRA 再把基座权重量化以省显存。这是挂在 Block 上的「微调叠加」，不是完整 SFT/RLHF 流水线，也不替换预训练主干拓扑。',
    formula: 'W^{\\prime}=W+\\frac{\\alpha}{r}BA',
    formulaText: 'W′ = W + (α/r) BA  （B∈d×r, A∈r×k，r≪）',
    inputs: [
      { shape: '冻结 W', label: '基座权重' },
      { shape: 'A, B', label: '可训低秩适配' },
    ],
    outputs: [{ shape: '等效 W′', label: '前向使用' }],
    bulletsZh: [
      '挂在 Block：常见插在 Attention / FFN 的线性层旁路',
      'QLoRA：4bit 等量化基座 + LoRA（公开方法）',
      '勿与「全参数 SFT」或「RLHF 奖励模型」整条流水线混淆',
    ],
    refs: [
      { title: 'LoRA (Hu et al.)', year: 2021, url: 'https://arxiv.org/abs/2106.09685' },
      { title: 'QLoRA (Dettmers et al.)', year: 2023, url: 'https://arxiv.org/abs/2305.14314' },
    ],
  },


  muon_opt: {
    id: 'muon_opt',
    nameZh: 'Muon 优化器',
    nameEn: 'Muon optimizer',
    summaryZh:
      '训练期优化器选件（公开）：对二维权重矩阵做动量更新的近似正交化（如 Newton–Schulz），再写回参数。DeepSeek-V4 / Kimi 等公开报告写明多数矩阵用 Muon，Embedding、LM Head、RMSNorm 等仍常配 AdamW。这不是网络结构层。',
    formula: 'U\\approx\\mathrm{Orth}(M),\\quad W\\leftarrow W-\\eta\\,U',
    formulaText: 'U ≈ Orth(M)，W ← W − η U  （示意）',
    inputs: [{ shape: '∇ / 动量矩阵', label: '二维权重更新' }],
    outputs: [{ shape: '与 W 同形', label: '更新后权重' }],
    bulletsZh: [
      '挂在「更新参数」：替换/混用 Opt.step 规则',
      'DeepSeek-V4 公开：Muon + AdamW 分组；Muon 也可带 weight decay',
      '不声称某一超参必优；数值以各公开报告为准',
    ],
    phase: 'training',
    refs: [
      { title: 'Muon (Jordan et al. / public notes)', year: 2024 },
      { title: 'DeepSeek-V4 technical report § Muon', year: 2026, url: 'https://arxiv.org/abs/2606.19348' },
    ],
  },
  adamw_train: {
    id: 'adamw_train',
    nameZh: 'AdamW 类优化器',
    nameEn: 'AdamW-class optimizer',
    summaryZh:
      '训练期默认优化器族：自适应一/二阶矩 + 解耦 weight decay。Llama / Qwen / Mistral 等公开配方常见；即便采用 Muon 的模型，Embedding / Head / 一维参数也往往仍留在 AdamW。',
    formula: '\\theta\\leftarrow\\theta-\\eta\\big(\\hat{m}/(\\sqrt{\\hat{v}}+\\epsilon)+\\lambda\\theta\\big)',
    formulaText: 'θ ← θ − η( m̂/(√v̂+ε) + λθ )  （AdamW 示意）',
    inputs: [{ shape: '与 θ 同形', label: '梯度 ∇θ' }],
    outputs: [{ shape: '与 θ 同形', label: '更新后 θ' }],
    bulletsZh: [
      '挂在「更新参数」：最常见的公开基线 Opt',
      'β、ε、η、λ 与模型/数据相关——此处只标机制',
    ],
    phase: 'training',
    refs: [
      { title: 'AdamW (Loshchilov & Hutter)', year: 2019, url: 'https://arxiv.org/abs/1711.05101' },
      { title: 'Llama 2 / Llama 3 public reports (optimizer practice)', year: 2024 },
      { title: 'Qwen2 Technical Report; Mistral 7B (public)', year: 2024 },
    ],
  },
  weight_decay: {
    id: 'weight_decay',
    nameZh: 'Weight Decay',
    nameEn: 'Weight decay',
    summaryZh:
      '训练期正则：在参数更新中衰减权重幅度（AdamW 为解耦衰减）。公开报告常给出具体 λ（如 DeepSeek-V4 对 AdamW/Muon 均提及 weight decay）。不是新层，而是 Opt 超参。',
    formula: '\\theta\\leftarrow\\theta-\\eta(\\ldots)-\\eta\\lambda\\theta',
    formulaText: '更新中含 −ηλθ 一类衰减项（示意）',
    inputs: [{ shape: 'θ', label: '当前参数' }],
    outputs: [{ shape: 'θ′', label: '衰减后参数' }],
    bulletsZh: [
      '挂在优化器旁：与学习率日程正交',
      '具体 λ 以各模型公开配置为准，本图不编造结果',
    ],
    phase: 'training',
    refs: [
      { title: 'DeepSeek-V4 technical report (weight_decay on AdamW/Muon)', year: 2026, url: 'https://arxiv.org/abs/2606.19348' },
      { title: 'AdamW (decoupled weight decay)', year: 2019 },
    ],
  },
  lr_cosine_warmup: {
    id: 'lr_cosine_warmup',
    nameZh: 'Warmup / Cosine',
    nameEn: 'LR warmup + cosine (and flat+cosine)',
    summaryZh:
      '公开常见的学习率日程：先线性 warmup，再按 cosine 衰减；或先长平台再末段 cosine。DeepSeek-V4 公开写明：约 2k step 线性 warmup → 大部分训练保持峰值 LR → 末段 cosine 降到更低 LR。这是训练日程，不是结构。',
    formula: '\\eta(t)=\\eta_{\\mathrm{warmup\\text{-}cosine}}(t)',
    formulaText: 'η(t) = warmup → (可选平台) → cosine 衰减',
    inputs: [{ shape: 'step t', label: '训练步' }],
    outputs: [{ shape: '标量 η', label: '当前学习率' }],
    bulletsZh: [
      'Llama/Qwen/Mistral 等公开讨论中常见 warmup + cosine 族日程',
      'DeepSeek-V4：warmup + 长平台 + 末段 cosine（公开报告原文）',
      '勿把日程画成网络模块',
    ],
    phase: 'training',
    detailSections: [
      {
        id: 'v4_public',
        titleZh: 'DeepSeek-V4 公开日程（摘录）',
        badgeZh: '公开',
        bodyZh:
          '技术报告描述：前 2000 step 线性 warmup；大部分训练维持峰值学习率；接近结束时按 cosine 衰减到更低学习率。另有 batch size 与序列长度分段扩展等——均属训练配方，非推理拓扑。',
      },
    ],
    refs: [
      { title: 'DeepSeek-V4 technical report (LR schedule)', year: 2026, url: 'https://arxiv.org/abs/2606.19348' },
    ],
  },
  lr_wsd: {
    id: 'lr_wsd',
    nameZh: 'WSD / Cooldown',
    nameEn: 'Warmup–Stable–Decay / cooldown',
    summaryZh:
      '公开讨论中的学习率形状：Warmup → 长稳定段 → Decay/Cooldown。与「warmup + 平台 + 末段衰减」同类日程词汇；具体曲线名以各论文为准。本徽章给面试速记，不把未写明 WSD 的报告强行改名。',
    formula: '\\eta(t):\\ \\mathrm{warmup}\\to\\mathrm{stable}\\to\\mathrm{decay/cooldown}',
    formulaText: 'warmup → stable → decay/cooldown',
    inputs: [{ shape: 'step t', label: '训练步' }],
    outputs: [{ shape: 'η(t)', label: '学习率' }],
    bulletsZh: [
      '概念层日程；可与 AdamW/Muon 任意组合',
      'DeepSeek-V4 公开表述是 warmup + 平台 + cosine，而非自我标注「WSD」——对照理解即可',
    ],
    phase: 'training',
  },
  mup_scaling: {
    id: 'mup_scaling',
    nameZh: 'μP（可选）',
    nameEn: 'Maximal Update Parametrization',
    summaryZh:
      '可选的宽度缩放参数化（μP / maximal update parametrization）公开理论与实践：使超参在模型变宽时更可迁移。并非所有开源包都采用；此处仅作训练侧可选笔记，无默认结果声明。',
    formulaText: '宽度缩放下学习率/初始化的 μP 规则（示意，见公开文献）',
    inputs: [{ shape: '宽度 / 深度', label: '模型规模' }],
    outputs: [{ shape: '超参规则', label: '可迁移配置' }],
    bulletsZh: [
      '可选挂点：训练配方笔记，不是必开结构层',
      '是否用于某开源模型以该模型公开说明为准',
    ],
    phase: 'training',
    refs: [{ title: 'Tensor Programs / μP (Yang et al., public)', year: 2022 }],
  },
  mxfp4_qat: {
    id: 'mxfp4_qat',
    nameZh: 'MXFP4 QAT',
    nameEn: 'MXFP4 quantization-aware training',
    summaryZh:
      'Kimi K3 公开：后训练阶段（SFT 起）做量化感知训练——MoE 专家权重 MXFP4、激活 MXFP8，注意力/共享专家/路由等保持更高精度；RL 时 rollout 与训练同量化方案，避免训推不一致。属训练/部署数值配方，不是新注意力结构。',
    formulaText: '专家 W ≈ MXFP4；激活 ≈ MXFP8；非专家更高精度（公开描述）',
    inputs: [{ shape: '全精度/高精度激活', label: 'QAT 前向' }],
    outputs: [{ shape: '量化友好权重', label: '可服务部署' }],
    bulletsZh: [
      '来源：Kimi K3 技术报告 / 模型卡「Native MXFP4」',
      '挂在训练视角：后训练 QAT，不是基线 Decoder 新分支',
    ],
    phase: 'training',
    refs: [
      { title: 'Kimi K3: Open Frontier Intelligence', year: 2026, url: 'https://arxiv.org/abs/2607.24653' },
      { title: 'moonshotai/Kimi-K3 model card', year: 2026, url: 'https://huggingface.co/moonshotai/Kimi-K3' },
    ],
  },

  // —— Training-time only (not inference architecture) ——
  loss: {
    id: 'loss',
    nameZh: '损失函数',
    nameEn: 'Loss (e.g. Cross-Entropy)',
    summaryZh:
      '训练期概念，不是推理结构层。标准语言建模目标是「下一个 token」交叉熵：把 LM Head 的 logits 经 softmax 得到 p(·|前文)，再对正确答案的负对数似然求和/平均，得到标量 L，作为反向传播的起点。推理生成走的是采样，不是这条 Loss。',
    formula: '\\mathcal{L}= -\\frac{1}{T}\\sum_t \\log p_\\theta(t_{t+1}\\mid t_{\\le t})',
    formulaText: 'L = −(1/T) Σ_t log p_θ(t_{t+1} | t_≤t)',
    inputs: [
      { shape: '[B, T, V]', label: 'logits' },
      { shape: '[B, T]', label: '目标 token id' },
    ],
    outputs: [{ shape: '标量', label: 'loss' }],
    bulletsZh: [
      '实现上常写成 CrossEntropy(logits, labels)，内部含 log-softmax + NLL',
      '可对 padding 位置 mask，只对有效 token 平均',
      '与「采样 / 解码」分叉：训练要可微的标量；推理要离散 token',
      'loss 对 θ 可微 → 启动 autograd → 优化器更新',
    ],
    detailSections: [
      {
        id: 'ce_next',
        titleZh: 'Next-token 交叉熵',
        badgeZh: '标准 LM',
        bodyZh:
          '对每个位置 t，模型输出词表上的 logits z_t；目标是真实的下一个 id y_t。先 softmax 得概率，再取 −log p(y_t)。整段序列平均后即常用的语言建模损失。教师强制（teacher forcing）下，前文用真实 token，而不是模型自己采出来的 token。',
        formula:
          'p(\\cdot\\mid t_{\\le t})=\\mathrm{softmax}(z_t),\\quad \\ell_t=-\\log p(y_t\\mid t_{\\le t})',
        formulaText: 'p = softmax(z_t)，ℓ_t = −log p(y_t | 前文)',
      },
      {
        id: 'vs_sample',
        titleZh: '和采样的关系',
        badgeZh: '分叉',
        bodyZh:
          '同一 logits：训练用金标签算 CE；推理用 greedy/top-k/top-p 变成离散 id。不要把 Loss 画进「输出文本」那条推理链——本图训练视角是从 LM Head 垂线接 Loss。',
      },
    ],
    phase: 'training',
  },
  autograd: {
    id: 'autograd',
    nameZh: '反向传播 / 梯度',
    nameEn: 'Backprop / Autograd',
    summaryZh:
      '训练期概念。框架沿前向计算图自动求导：从 loss 出发，经 LM Head → Block×N → Embedding 等，得到各参数的梯度 ∂L/∂θ。这不是多出来的「网络层」，而是对同一条计算图的反向遍历。',
    formula: '\\frac{\\partial\\mathcal{L}}{\\partial\\theta}=\\mathrm{autograd}(\\mathcal{L},\\theta)',
    formulaText: '∂L/∂θ = autograd(L, θ)',
    inputs: [
      { shape: '标量', label: 'loss' },
      { shape: '计算图', label: '前向节点与依赖' },
    ],
    outputs: [{ shape: '与 θ 同形', label: '梯度 ∂L/∂θ' }],
    bulletsZh: [
      '训练期：梯度沿计算图反向流动',
      '与 KV Cache（推理）不同：推理一般不建训练图、不算参数梯度',
      '残差连接有助于深层梯度通路',
    ],
    phase: 'training',
  },
  optimizer_update: {
    id: 'optimizer_update',
    nameZh: '更新参数',
    nameEn: 'Optimizer Step (AdamW / Muon / …)',
    summaryZh:
      '训练期概念。Autograd 算出 ∇θ 之后，优化器决定「这一步怎么改参数」。AdamW 是目前 LLM 预训练最常见的默认选择（自适应二阶矩 + 解耦 weight decay）；Muon 等新优化器则对二维权重矩阵用不同的更新几何（如正交化动量更新）。二者都不是网络结构层——只是训练循环里的一步。学习率日程（含 warmup / 稳定段 / 衰减或 cooldown）通常叠在优化器之外单独配置。',
    formula: '\\theta \\leftarrow \\mathrm{Opt}(\\theta,\\nabla_\\theta\\mathcal{L};\\eta,\\ldots)',
    formulaText: 'θ ← Opt(θ, ∇_θ L；学习率 η, …)',
    inputs: [
      { shape: '与 θ 同形', label: '参数 θ' },
      { shape: '与 θ 同形', label: '梯度 ∇θ' },
    ],
    outputs: [{ shape: '与 θ 同形', label: '更新后的 θ' }],
    cardBadgesZh: ['AdamW', 'Muon'],
    bulletsZh: [
      '发生在反传之后：先有 ∇θ，再 Opt.step()',
      '学习率 η、weight decay、β 等超参在这里生效；日程（WSD 等）调节 η(t)',
      'AdamW 通用于几乎所有参数张量；Muon 主要针对二维权重，其它参数仍常配 AdamW',
      '推理只加载最终 θ，不再调用优化器',
    ],
    detailSections: [
      {
        id: 'adamw',
        titleZh: 'AdamW',
        badgeZh: '主流默认',
        bodyZh:
          '在 Adam 的一阶/二阶动量之上，把 weight decay 与梯度自适应项解耦：衰减直接作用在参数上，而不是混进自适应步长里。对 embedding、偏置、一维参数与多数矩阵都适用，实现成熟，是公开 LLM 训练配方里最常见的基线优化器。',
        formula:
          'm\\leftarrow\\beta_1 m+(1-\\beta_1)g,\\; v\\leftarrow\\beta_2 v+(1-\\beta_2)g^{\\odot 2},\\; \\theta\\leftarrow\\theta-\\eta\\big(\\hat{m}/(\\sqrt{\\hat{v}}+\\epsilon)+\\lambda\\theta\\big)',
        formulaText:
          'm←β₁m+(1−β₁)g；v←β₂v+(1−β₂)g²；θ←θ−η( m̂/(√v̂+ε) + λθ )  （示意，含 bias-correction）',
        bulletsZh: [
          '解耦衰减 λθ：与「L2 正则加进 loss」在自适应优化下不等价，这是 AdamW 的要点',
          'β₁/β₂、ε、η、λ 需与 batch、模型规模一起调；此处只给机制不给「必胜」超参',
        ],
      },
      {
        id: 'muon',
        titleZh: 'Muon',
        badgeZh: '矩阵更新',
        bodyZh:
          'Muon（公开实现与讨论中）面向二维权重：对动量/更新矩阵做近似正交化（如 Newton–Schulz 迭代），再按学习率写回，使更新更接近「在正交约束感下的方向」而非逐坐标自适应缩放。与 AdamW 的差异主要在更新几何，而不是多了一层网络。实践中常见：矩阵用 Muon，embedding / 标量 / 一维仍用 AdamW（以各公开配方为准）。',
        formula: 'U\\approx\\mathrm{Orth}(M),\\quad W\\leftarrow W-\\eta\\,U',
        formulaText: 'U ≈ Orth(M)（正交化动量/更新），W ← W − η U',
        bulletsZh: [
          '何时不同：宽而深的二维权重上，Muon 改变步长「方向结构」；AdamW 更偏逐元素自适应幅度',
          '不要把 Muon 理解成新的 Block 或 Attention 变体——它只替换 Opt.step 的规则',
        ],
      },
      {
        id: 'wsd',
        titleZh: '学习率与 WSD / cooldown（概念）',
        badgeZh: '日程',
        bodyZh:
          '优化器之外通常还有 η(t) 日程。一种公开讨论较多的形状是 Warmup–Stable–Decay（WSD）：先升高学习率，再长时间稳定，最后进入衰减/cooldown。cooldown 指训练末段把 η 降下来、让参数落稳的阶段——这是日程设计概念，具体曲线、时长与收益以各公开报告为准，此处不外推未公开结论。',
        formula: '\\eta(t)=\\eta_{\\mathrm{schedule}}(t)\\cdot\\eta_0',
        formulaText: 'η(t) = schedule(t) · η₀  （warmup → stable → decay/cooldown）',
        bulletsZh: [
          '日程与选 AdamW 还是 Muon 正交：同一优化器可配不同 schedule',
          '本图只提示「更新参数」步骤存在；不声称某一日程必优',
        ],
      },
      {
        id: 'compare',
        titleZh: '对照速记',
        badgeZh: 'AdamW ↔ Muon',
        bodyZh: '同一 ∇θ 进来，出去的是不同规则写下的 Δθ。',
        bulletsZh: [
          'AdamW：坐标自适应 + 解耦衰减；通用、默认',
          'Muon：二维权重上正交化式更新；常与 AdamW 混用',
          '共同点：都在反传之后；都不出现在推理 forward',
        ],
      },
    ],
    refs: [
      { title: 'AdamW (Loshchilov & Hutter)', year: 2019 },
      { title: 'Muon optimizer (public implementation / notes)', year: 2024 },
    ],
    phase: 'training',
  },
}

/** Default left-to-right pipeline order on the home map */
export const CANONICAL_PIPELINE_IDS = [
  'tokens',
  'embedding',
  'block',
  'attention',
  'ffn',
  'norm',
  'lm_head',
  'sampling',
  'output_text',
] as const

/** Training-view nodes — not part of inference architecture */
export const TRAINING_MODULE_IDS = ['loss', 'autograd', 'optimizer_update'] as const

export const PIPELINE_EDGES: { from: string; to: string; labelZh?: string }[] = [
  { from: 'tokens', to: 'embedding' },
  { from: 'embedding', to: 'block', labelZh: '× N 层' },
  { from: 'block', to: 'attention', labelZh: '子模块' },
  { from: 'block', to: 'ffn', labelZh: '子模块' },
  { from: 'block', to: 'norm', labelZh: '子模块' },
  { from: 'block', to: 'lm_head' },
  { from: 'lm_head', to: 'sampling', labelZh: '采样' },
  { from: 'sampling', to: 'output_text', labelZh: '文本' },
]
