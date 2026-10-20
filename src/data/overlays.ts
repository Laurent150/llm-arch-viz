import type { OverlayLayer } from '../types/architecture'

/**
 * Orthogonal overlay layers hung on the canonical dense Decoder map.
 * Multi-select is for comparison only — layers are OPTIONAL / REPLACEABLE,
 * not simultaneous mandatory modules in one model.
 */
export const OVERLAYS: OverlayLayer[] = [
  {
    id: 'rope',
    nameZh: 'RoPE',
    nameEn: 'Rotary Position Embedding',
    accent: '#38bdf8',
    /** 位置编码的一种选法，替代绝对 PE，不是额外必装模块 */
    role: 'alternative',
    roleLabelZh: '可选 · 替代位置方案',
    blurbZh:
      '位置编码的一种常见选法：通过旋转 Q/K 注入相对位置，通常替代绝对正弦 / 学习式 PE，而非再叠一层必选模块。',
    source: {
      title: 'RoFormer: Enhanced Transformer with Rotary Position Embedding',
      year: 2021,
      noteZh: '公开论文；长上下文外推技巧另见 YaRN 等后续公开工作。',
      url: 'https://arxiv.org/abs/2104.09864',
    },
    attachments: [
      {
        targetId: 'embedding',
        kind: 'badge',
        labelZh: 'RoPE',
        badgeKindZh: '可选',
        moduleId: 'rope',
      },
      {
        targetId: 'attention',
        kind: 'badge',
        labelZh: 'Q/K 旋转',
        badgeKindZh: '替代',
        moduleId: 'rope',
      },
    ],
    highlightModuleIds: ['embedding', 'attention'],
    highlightNotesZh: [
      '可选：多数开源 LLM 选 RoPE，也有模型用其他位置方案。',
      '替代关系：相对「绝对 PE 加在 Embedding 上」的一种换法，不是永远并存。',
    ],
  },
  {
    id: 'mqa_gqa',
    nameZh: 'MQA / GQA',
    nameEn: 'Multi / Grouped-Query Attention',
    accent: '#a78bfa',
    role: 'alternative',
    roleLabelZh: '可选 · 替代注意力头布局',
    blurbZh:
      '对多头注意力里 K/V 头数量的改写（MQA 全共享 / GQA 分组共享）。是「替代」标准 MHA 的一种实现，不是在 MHA 旁边再加一条必选通路。',
    source: {
      title: 'MQA (Shazeer 2019); GQA (Ainslie et al. 2023)',
      year: 2023,
      noteZh: '仅依据公开论文；具体头数配置因模型而异。',
      url: 'https://arxiv.org/abs/2305.13245',
    },
    attachments: [
      {
        targetId: 'attention',
        kind: 'badge',
        labelZh: 'MQA/GQA',
        badgeKindZh: '替代',
        moduleId: 'mqa_gqa',
      },
    ],
    highlightModuleIds: ['attention'],
    highlightNotesZh: [
      '替代：替换标准 Multi-Head 的 K/V 布局，不是并行多套注意力。',
      '可选：稠密 MHA 模型完全可以不采用 GQA。',
    ],
  },
  {
    id: 'moe',
    nameZh: 'MoE',
    nameEn: 'Mixture-of-Experts',
    accent: '#f59e0b',
    role: 'alternative',
    roleLabelZh: '可选 · 替代稠密 FFN',
    blurbZh:
      '用稀疏路由的多专家替换（或部分替换）稠密 FFN。打开此开关是在看「FFN 的一种替代形态」，不等于每个模型都同时有稠密 FFN + MoE。',
    source: {
      title: 'Switch Transformer; Mixtral / DeepSeek-MoE public reports',
      year: 2021,
      noteZh: '结构示意来自公开论文与开源权重描述，非内部蓝图。',
      url: 'https://arxiv.org/abs/2101.03961',
    },
    attachments: [
      {
        targetId: 'ffn',
        kind: 'badge',
        labelZh: 'MoE 专家',
        badgeKindZh: '替代',
        moduleId: 'moe_ffn',
      },
    ],
    highlightModuleIds: ['ffn', 'block'],
    highlightNotesZh: [
      '替代：MoE 通常替换稠密 FFN（或替换部分层的 FFN）。',
      '可选：大量公开模型仍是纯稠密 FFN，没有专家层。',
    ],
  },
  {
    id: 'multimodal',
    nameZh: '多模态',
    nameEn: 'Vision → LLM',
    accent: '#22c55e',
    role: 'addon',
    roleLabelZh: '可选 · 附加分支',
    blurbZh:
      '在文本流水线左侧增加视觉编码器分支并汇入。纯文本 LLM 没有这条分支；打开开关只是演示「可选附加」，不是基线必有模块。',
    source: {
      title: 'LLaVA / Flamingo-style public reports',
      year: 2023,
      noteZh: '仅展示公开文献中的常见流水线，不复刻未公开内部结构。',
      url: 'https://arxiv.org/abs/2304.08485',
    },
    attachments: [
      {
        targetId: 'tokens',
        kind: 'branch-in',
        labelZh: '视觉编码器',
        badgeKindZh: '可选',
        moduleId: 'vision_encoder',
      },
    ],
    highlightModuleIds: ['tokens', 'embedding'],
    highlightNotesZh: [
      '附加：左侧分支汇入；纯文本模型不含此分支。',
      'LLM 主干在许多公开方案中保持不变。',
    ],
  },
  {
    id: 'kv_cache',
    nameZh: 'KV Cache',
    nameEn: 'Inference Cache',
    accent: '#f472b6',
    role: 'inference',
    roleLabelZh: '推理期 · 非训练结构',
    blurbZh:
      '自回归解码时的工程路径：缓存历史 K/V。属于推理期优化，不是训练时多出来的网络层；打开开关只高亮「怎么跑」，不表示多装了一个永久模块。',
    source: {
      title: 'Public LLM serving literature (e.g. vLLM / PagedAttention papers)',
      year: 2023,
      noteZh: '系统优化属于公开资料范畴；此处只画概念级数据流。',
      url: 'https://arxiv.org/abs/2309.06180',
    },
    attachments: [
      {
        targetId: 'attention',
        kind: 'loop',
        labelZh: 'KV Cache',
        badgeKindZh: '推理期',
        moduleId: 'kv_cache',
      },
    ],
    highlightModuleIds: ['attention'],
    highlightNotesZh: [
      '推理期：虚线环回表示解码缓存，不是额外训练层。',
      '与 GQA/MQA 组合时显存收益更明显（公开共识），但仍是可选实现细节。',
    ],
  },
  {
    id: 'swiglu',
    nameZh: 'SwiGLU',
    nameEn: 'SwiGLU FFN',
    accent: '#34d399',
    role: 'alternative',
    roleLabelZh: '可选 · 替代 FFN 激活',
    blurbZh:
      '把门控 SwiGLU 当作稠密 FFN 的具体形态。Llama / Qwen / Mistral 等公开模型常用；打开后挂在 FFN 上，表示「用这种 FFN」，不是并行多套 FFN。',
    source: {
      title: 'GLU Variants Improve Transformer (Shazeer)',
      year: 2020,
      noteZh: '公开论文；各模型中间宽度与实现细节以模型卡为准。',
      url: 'https://arxiv.org/abs/2002.05202',
    },
    attachments: [
      {
        targetId: 'ffn',
        kind: 'badge',
        labelZh: 'SwiGLU',
        badgeKindZh: '替代',
        moduleId: 'swiglu_ffn',
      },
    ],
    highlightModuleIds: ['ffn', 'block'],
    highlightNotesZh: [
      '替代：替换基线「通用 σ」FFN 的激活/门控选型。',
      '模型包（Llama / Qwen / Mistral）会一并打开此层。',
    ],
  },
  {
    id: 'rmsnorm',
    nameZh: 'RMSNorm',
    nameEn: 'RMSNorm Pre-Norm',
    accent: '#94a3b8',
    role: 'alternative',
    roleLabelZh: '可选 · 替代归一化',
    blurbZh:
      '强调 RMSNorm + Pre-Norm 这一公开主流选法，挂在 Norm 节点。许多开源 Decoder 还常省略线性 bias——属实现习惯，叠在说明里提示即可。',
    source: {
      title: 'Root Mean Square Layer Normalization',
      year: 2019,
      noteZh: '公开论文；与 Llama/Qwen/Mistral 等报告中的 Pre-Norm 描述一致。',
      url: 'https://arxiv.org/abs/1910.07467',
    },
    attachments: [
      {
        targetId: 'norm',
        kind: 'badge',
        labelZh: 'RMSNorm',
        badgeKindZh: '替代',
        moduleId: 'rmsnorm_prenorm',
      },
    ],
    highlightModuleIds: ['norm', 'block'],
    highlightNotesZh: [
      '替代/细化：基线已有 Norm+残差，此层标明 RMS + Pre-Norm。',
      'Llama 等公开实现常无 bias（非本层强制）。',
    ],
  },
  {
    id: 'mla',
    nameZh: 'MLA',
    nameEn: 'Multi-head Latent Attention',
    accent: '#fb7185',
    role: 'alternative',
    roleLabelZh: '可选 · 替代注意力',
    blurbZh:
      'DeepSeek-V2/V3 公开报告中的 Multi-head Latent Attention：压缩 KV 以降低缓存。挂在 Attention 上表示替代标准 MHA/GQA 存储布局，不另画并行主干。',
    source: {
      title: 'DeepSeek-V2 Technical Report',
      year: 2024,
      noteZh: '仅依据公开技术报告的高层描述，不复刻未公开内核。',
      url: 'https://arxiv.org/abs/2405.04434',
    },
    attachments: [
      {
        targetId: 'attention',
        kind: 'badge',
        labelZh: 'MLA',
        badgeKindZh: '替代',
        moduleId: 'mla_attention',
      },
    ],
    highlightModuleIds: ['attention', 'block'],
    highlightNotesZh: [
      '替代：替换标准注意力的 KV 路径；与 GQA 开关勿理解为必须同时永久并存。',
      'DeepSeek / Kimi（K2）等公开模型包会与 MoE 等一并打开以便对照。',
    ],
  },
  {
    id: 'sliding_window',
    nameZh: '滑动窗口',
    nameEn: 'Sliding Window Attention',
    accent: '#2dd4bf',
    role: 'alternative',
    roleLabelZh: '可选 · 替代注意力掩码',
    blurbZh:
      'Mistral 7B 公开采用的滑动窗口因果掩码：限制可见上下文窗口以换效率。挂在 Attention 上，与 GQA 等组合出现在 Mistral 配方中。',
    source: {
      title: 'Mistral 7B',
      year: 2023,
      noteZh: '公开论文中的 Sliding Window Attention；窗口大小以模型卡为准。',
      url: 'https://arxiv.org/abs/2310.06825',
    },
    attachments: [
      {
        targetId: 'attention',
        kind: 'badge',
        labelZh: '滑动窗口',
        badgeKindZh: '替代',
        moduleId: 'sliding_window_attn',
      },
    ],
    highlightModuleIds: ['attention', 'block'],
    highlightNotesZh: [
      '替代掩码范围：不是第二条完整注意力蜘蛛网。',
      'Mistral 模型包会与 GQA / SwiGLU / RMSNorm / RoPE 一并打开。',
    ],
  },
  {
    id: 'csa_hca',
    nameZh: 'CSA/HCA',
    nameEn: 'CSA + HCA Hybrid Attention',
    accent: '#e879f9',
    role: 'alternative',
    roleLabelZh: '可选 · 替代注意力',
    blurbZh:
      'DeepSeek-V4 公开的 CSA（压缩稀疏）与 HCA（强压缩稠密）混合注意力，面向约 1M 上下文效率；相对 V2/V3 的 MLA 是另一条公开路线。',
    source: {
      title: 'DeepSeek-V4 technical report',
      year: 2026,
      noteZh: '公开预览报告；层间 CSA/HCA 配比以报告为准。',
      url: 'https://arxiv.org/abs/2606.19348',
    },
    attachments: [
      {
        targetId: 'attention',
        kind: 'badge',
        labelZh: 'CSA/HCA',
        badgeKindZh: '替代',
        moduleId: 'csa_hca_attention',
      },
    ],
    highlightModuleIds: ['attention', 'block'],
    highlightNotesZh: [
      '替代 MLA：V4 包打开本层而非 mla。',
      'Muon 是训练优化器，不会作为结构徽章打开。',
    ],
  },
  {
    id: 'mhc',
    nameZh: 'mHC',
    nameEn: 'Manifold-Constrained Hyper-Connections',
    accent: '#c084fc',
    role: 'alternative',
    roleLabelZh: '可选 · 替代残差',
    blurbZh:
      'DeepSeek-V4 的 mHC：用受约束的多流超连接增强 plain residual。挂在 Norm/残差节点。',
    source: {
      title: 'DeepSeek-V4 technical report (mHC)',
      year: 2026,
      noteZh: '公开报告高层描述。',
      url: 'https://arxiv.org/abs/2606.19348',
    },
    attachments: [
      {
        targetId: 'norm',
        kind: 'badge',
        labelZh: 'mHC',
        badgeKindZh: '替代',
        moduleId: 'mhc_residual',
      },
    ],
    highlightModuleIds: ['norm', 'block'],
    highlightNotesZh: ['替代/增强残差通路，不是并行新主干。'],
  },
  {
    id: 'partial_rope',
    nameZh: 'Partial RoPE',
    nameEn: 'Partial RoPE',
    accent: '#7dd3fc',
    role: 'alternative',
    roleLabelZh: '可选 · 替代位置方案',
    blurbZh:
      'DeepSeek-V4 公开的 Partial RoPE（仅部分维度旋转）。与全维 RoPE 对照；V4 包打开本层。',
    source: {
      title: 'DeepSeek-V4 technical report',
      year: 2026,
      noteZh: '公开报告中的 partial / inverse-position RoPE 描述。',
      url: 'https://arxiv.org/abs/2606.19348',
    },
    attachments: [
      {
        targetId: 'embedding',
        kind: 'badge',
        labelZh: 'Partial RoPE',
        badgeKindZh: '替代',
        moduleId: 'partial_rope',
      },
      {
        targetId: 'attention',
        kind: 'badge',
        labelZh: '部分旋转',
        badgeKindZh: '可选',
        moduleId: 'partial_rope',
      },
    ],
    highlightModuleIds: ['embedding', 'attention'],
    highlightNotesZh: ['V4 长上下文配方的一部分；勿与全维 RoPE 理解为必须双开。'],
  },
  {
    id: 'kda',
    nameZh: 'KDA',
    nameEn: 'Kimi Delta Attention',
    accent: '#fb7185',
    role: 'alternative',
    roleLabelZh: '可选 · 替代注意力',
    blurbZh:
      'Kimi K3 的 KDA：与 Gated MLA 按公开 3:1 混合。挂在 Attention；K3 包会同时打开 MLA 徽章表示 Gated MLA 支路。',
    source: {
      title: 'Kimi K3 technical report / GitHub',
      year: 2026,
      noteZh: '公开：69 KDA + 24 Gated MLA 等层配比以模型卡为准。',
      url: 'https://github.com/MoonshotAI/Kimi-K3',
    },
    attachments: [
      {
        targetId: 'attention',
        kind: 'badge',
        labelZh: 'KDA',
        badgeKindZh: '替代',
        moduleId: 'kda_attention',
      },
    ],
    highlightModuleIds: ['attention', 'block'],
    highlightNotesZh: ['与 Gated MLA 混合，不是两条并行完整主干。'],
  },
  {
    id: 'attn_res',
    nameZh: 'AttnRes',
    nameEn: 'Attention Residuals',
    accent: '#f9a8d4',
    role: 'alternative',
    roleLabelZh: '可选 · 替代残差',
    blurbZh:
      'Kimi K3 的 AttnRes：跨层选择性取回历史表示。挂在 Norm/残差。',
    source: {
      title: 'Kimi K3: Open Frontier Intelligence',
      year: 2026,
      noteZh: '公开技术报告 § Attention Residuals。',
      url: 'https://arxiv.org/abs/2607.24653',
    },
    attachments: [
      {
        targetId: 'norm',
        kind: 'badge',
        labelZh: 'AttnRes',
        badgeKindZh: '替代',
        moduleId: 'attn_res',
      },
    ],
    highlightModuleIds: ['norm', 'block'],
    highlightNotesZh: ['深度方向信息通路；与 mHC（DeepSeek-V4）是不同公开方案。'],
  },
  {
    id: 'situ_glu',
    nameZh: 'SiTU-GLU',
    nameEn: 'SiTU-GLU',
    accent: '#fda4af',
    role: 'alternative',
    roleLabelZh: '可选 · 替代 FFN 激活',
    blurbZh:
      'Kimi K3 公开激活函数 SiTU-GLU。挂在 FFN；相对 SwiGLU 为另一公开选型。',
    source: {
      title: 'MoonshotAI/Kimi-K3 model summary',
      year: 2026,
      noteZh: '模型卡 Activation Function = SiTU-GLU。',
      url: 'https://github.com/MoonshotAI/Kimi-K3',
    },
    attachments: [
      {
        targetId: 'ffn',
        kind: 'badge',
        labelZh: 'SiTU-GLU',
        badgeKindZh: '替代',
        moduleId: 'situ_glu',
      },
    ],
    highlightModuleIds: ['ffn', 'block'],
    highlightNotesZh: ['K3 包打开本层；K2 包仍用 SwiGLU。'],
  },
  {
    id: 'latent_moe',
    nameZh: 'LatentMoE',
    nameEn: 'Stable LatentMoE',
    accent: '#fbbf24',
    role: 'alternative',
    roleLabelZh: '可选 · 替代稠密 FFN',
    blurbZh:
      'Kimi K3 的 Stable LatentMoE（潜在宽度路由专家）。挂在 FFN；与通用 MoE 徽章对照。',
    source: {
      title: 'Kimi K3 technical report (LatentMoE)',
      year: 2026,
      noteZh: '公开：896 路由专家中激活 16 等，以模型卡为准。',
      url: 'https://arxiv.org/abs/2607.24653',
    },
    attachments: [
      {
        targetId: 'ffn',
        kind: 'badge',
        labelZh: 'LatentMoE',
        badgeKindZh: '替代',
        moduleId: 'latent_moe',
      },
    ],
    highlightModuleIds: ['ffn', 'block'],
    highlightNotesZh: ['K3 优先本层；DeepSeek/K2 包仍用通用 moe 叠加。'],
  },

  {
    id: 'yarn_ntk',
    nameZh: 'YaRN / NTK',
    nameEn: 'YaRN / NTK-aware scaling',
    accent: '#67e8f9',
    role: 'addon',
    roleLabelZh: '可选 · 长上下文外推',
    blurbZh:
      '在 RoPE 之上的公开外推技巧（NTK-aware / YaRN）。挂在 Embedding/位置，表示「怎么把位置频率拉到更长上下文」，不是另起一条并行位置网。',
    source: {
      title: 'YaRN (Peng et al.); NTK-aware RoPE scaling',
      year: 2023,
      noteZh: '公开论文与社区笔记；系数因模型而异。',
      url: 'https://arxiv.org/abs/2309.00071',
    },
    attachments: [
      {
        targetId: 'embedding',
        kind: 'badge',
        labelZh: 'YaRN/NTK',
        badgeKindZh: '可选',
        moduleId: 'yarn_ntk',
      },
    ],
    highlightModuleIds: ['embedding', 'attention'],
    highlightNotesZh: ['常叠在 RoPE 配方上；勿理解成第二套 Embedding 主干。'],
  },
  {
    id: 'qk_norm',
    nameZh: 'QK-Norm',
    nameEn: 'Query-Key Normalization',
    accent: '#c4b5fd',
    role: 'alternative',
    roleLabelZh: '可选 · 注意力内部改写',
    blurbZh:
      '对 Q/K 做归一化再算注意力。挂在 Attention；是稳定 logits 的可选技巧，不是并行注意力蜘蛛网。',
    source: {
      title: 'QK-Norm (public LLM training literature)',
      year: 2023,
      noteZh: '公开训练笔记/论文中的常见稳定性技巧。',
    },
    attachments: [
      {
        targetId: 'attention',
        kind: 'badge',
        labelZh: 'QK-Norm',
        badgeKindZh: '可选',
        moduleId: 'qk_norm',
      },
    ],
    highlightModuleIds: ['attention'],
    highlightNotesZh: ['Attention 内部改写；可与 GQA/RoPE 组合。'],
  },
  {
    id: 'flash_attn',
    nameZh: 'FlashAttention',
    nameEn: 'FlashAttention',
    accent: '#f0abfc',
    role: 'inference',
    roleLabelZh: '推理/训练内核 · 非新结构',
    blurbZh:
      'IO 感知的精确注意力核：同构图、更少 HBM 读写。挂在 Attention，表示实现层优化，不是新架构分支。',
    source: {
      title: 'FlashAttention (Dao et al.)',
      year: 2022,
      noteZh: '公开论文；FA2/FA3 等后续实现以部署为准。',
      url: 'https://arxiv.org/abs/2205.14135',
    },
    attachments: [
      {
        targetId: 'attention',
        kind: 'badge',
        labelZh: 'FlashAttn',
        badgeKindZh: '推理期',
        moduleId: 'flash_attn',
      },
    ],
    highlightModuleIds: ['attention'],
    highlightNotesZh: ['实现等价于标准 Attn；训练/推理内核均可出现。'],
  },
  {
    id: 'paged_attn',
    nameZh: 'PagedAttention',
    nameEn: 'PagedAttention',
    accent: '#fb7185',
    role: 'inference',
    roleLabelZh: '推理期 · KV 分页',
    blurbZh:
      '服务侧分页管理 KV Cache（vLLM 等公开工作）。挂在 Attention/KV 路径，说明「cache 怎么存」，不改 Transformer 公式。',
    source: {
      title: 'PagedAttention / vLLM paper',
      year: 2023,
      noteZh: '公开服务系统论文；与 FlashAttention 正交。',
      url: 'https://arxiv.org/abs/2309.06180',
    },
    attachments: [
      {
        targetId: 'attention',
        kind: 'loop',
        labelZh: 'PagedAttn',
        badgeKindZh: '推理期',
        moduleId: 'paged_attn',
      },
    ],
    highlightModuleIds: ['attention'],
    highlightNotesZh: ['推理期内存管理；可与 KV Cache 徽章对照理解。'],
  },
  {
    id: 'amp_precision',
    nameZh: 'bf16 / fp16',
    nameEn: 'Mixed precision',
    accent: '#fdba74',
    role: 'training',
    roleLabelZh: '训练期 · 数值精度',
    blurbZh:
      '混合精度训练（bf16/fp16）。徽章挂在 Opt/Autograd 附近；不是推理结构层。',
    source: {
      title: 'Mixed-precision training (public docs)',
      year: 2018,
      noteZh: '框架文档与公开配方；bf16 在近年预训练更常见。',
    },
    attachments: [
      {
        targetId: 'optimizer_update',
        kind: 'badge',
        labelZh: 'bf16/fp16',
        badgeKindZh: '训练期',
        moduleId: 'amp_precision',
      },
      {
        targetId: 'autograd',
        kind: 'badge',
        labelZh: 'AMP',
        badgeKindZh: '训练期',
        moduleId: 'amp_precision',
      },
    ],
    highlightModuleIds: ['optimizer_update', 'autograd'],
    highlightNotesZh: ['仅训练视角显示；改数值格式，不改拓扑。'],
  },
  {
    id: 'grad_accum',
    nameZh: '梯度累积',
    nameEn: 'Gradient accumulation',
    accent: '#fbbf24',
    role: 'training',
    roleLabelZh: '训练期 · 等效大 batch',
    blurbZh:
      '多 micro-batch 累加梯度后再 Opt.step()。挂在「更新参数」旁。',
    source: {
      title: 'Public training recipes / framework docs',
      year: 2020,
      noteZh: '工程常识级技巧；步数与全局 batch 以各报告为准。',
    },
    attachments: [
      {
        targetId: 'optimizer_update',
        kind: 'badge',
        labelZh: 'GradAccum',
        badgeKindZh: '训练期',
        moduleId: 'grad_accum',
      },
    ],
    highlightModuleIds: ['optimizer_update'],
    highlightNotesZh: ['拉开 step 频率；不是新网络层。'],
  },
  {
    id: 'act_checkpoint',
    nameZh: '激活检查点',
    nameEn: 'Activation checkpointing',
    accent: '#fcd34d',
    role: 'training',
    roleLabelZh: '训练期 · 显存换算力',
    blurbZh:
      '反传时重算激活以省显存。挂在 Autograd 旁。',
    source: {
      title: 'Gradient checkpointing (public)',
      year: 2016,
      noteZh: '框架与论文公开方法；推理通常不用。',
    },
    attachments: [
      {
        targetId: 'autograd',
        kind: 'badge',
        labelZh: 'Checkpoint',
        badgeKindZh: '训练期',
        moduleId: 'act_checkpoint',
      },
    ],
    highlightModuleIds: ['autograd', 'block'],
    highlightNotesZh: ['改反传存算权衡，不改推理 forward 拓扑。'],
  },
  {
    id: 'dist_parallel',
    nameZh: 'ZeRO / FSDP / TP·PP',
    nameEn: 'Distributed parallelism',
    accent: '#f97316',
    role: 'training',
    roleLabelZh: '训练期 · 分布式速记',
    blurbZh:
      'ZeRO/FSDP 分片、TP 切宽、PP 切深的面试速记。挂在优化器旁，并在训练条显示简短说明——描述设备如何分参数，不是新模型图。',
    source: {
      title: 'ZeRO; FSDP; Megatron-LM public docs',
      year: 2020,
      noteZh: '公开系统文献；组合方式因集群与框架而异。',
    },
    attachments: [
      {
        targetId: 'optimizer_update',
        kind: 'badge',
        labelZh: 'ZeRO/FSDP',
        badgeKindZh: '训练期',
        moduleId: 'dist_parallel',
      },
      {
        targetId: 'loss',
        kind: 'badge',
        labelZh: 'TP/PP',
        badgeKindZh: '训练期',
        moduleId: 'dist_parallel',
      },
    ],
    highlightModuleIds: ['optimizer_update', 'loss', 'block'],
    highlightNotesZh: ['分布式布局速记；勿画成第二条模型蜘蛛网。'],
  },
  {
    id: 'lora_qlora',
    nameZh: 'LoRA / QLoRA',
    nameEn: 'LoRA / QLoRA',
    accent: '#4ade80',
    role: 'addon',
    roleLabelZh: '可选 · 微调旁路',
    blurbZh:
      '低秩适配（及量化基座的 QLoRA）。挂在 Block，表示微调叠加旁路——不是完整 SFT/RLHF 流水线。',
    source: {
      title: 'LoRA (Hu et al.); QLoRA (Dettmers et al.)',
      year: 2021,
      noteZh: '公开 PEFT 方法；插入位置多为 Attention/FFN 线性层。',
      url: 'https://arxiv.org/abs/2106.09685',
    },
    attachments: [
      {
        targetId: 'block',
        kind: 'badge',
        labelZh: 'LoRA/QLoRA',
        badgeKindZh: '可选',
        moduleId: 'lora_qlora',
      },
    ],
    highlightModuleIds: ['block', 'attention', 'ffn'],
    highlightNotesZh: ['Block 级旁路适配；勿与全参数 SFT/RLHF 整图混淆。'],
  },
  {
    id: 'muon_opt',
    nameZh: 'Muon',
    nameEn: 'Muon optimizer',
    accent: '#fb923c',
    role: 'training',
    roleLabelZh: '训练期 · 公开优化器',
    blurbZh:
      '公开报告中的 Muon 优化器（二维权重正交化式更新）。DeepSeek-V4 / Kimi 等开源技术报告写明采用；非结构层。',
    source: {
      title: 'DeepSeek-V4 tech report §2.4 Muon; Kimi K2/K3 public reports',
      year: 2026,
      noteZh: '来源标注：DeepSeek-V4 论文；Kimi 开源报告/模型卡。仅复述公开写法。',
      url: 'https://arxiv.org/abs/2606.19348',
    },
    attachments: [
      {
        targetId: 'optimizer_update',
        kind: 'badge',
        labelZh: 'Muon',
        badgeKindZh: '训练期',
        moduleId: 'muon_opt',
      },
    ],
    highlightModuleIds: ['optimizer_update'],
    highlightNotesZh: [
      '来源：DeepSeek-V4 公开称多数矩阵用 Muon，Embedding/Head/RMSNorm/mHC 门控等仍 AdamW',
      'Kimi 开源报告亦讨论 Muon 类训练配方——以原文为准',
    ],
  },
  {
    id: 'adamw_train',
    nameZh: 'AdamW',
    nameEn: 'AdamW-class',
    accent: '#fdba74',
    role: 'training',
    roleLabelZh: '训练期 · 公开优化器',
    blurbZh:
      'AdamW 类优化器：Llama / Qwen / Mistral 等公开报告与开源训练讨论中的常见默认；Muon 配方里也常保留给 Embedding/Head。',
    source: {
      title: 'AdamW paper; Llama 2/3, Qwen2, Mistral 7B public reports',
      year: 2019,
      noteZh: '来源：AdamW 论文 + 各开源技术报告中的优化器描述；不编造超参结果。',
      url: 'https://arxiv.org/abs/1711.05101',
    },
    attachments: [
      {
        targetId: 'optimizer_update',
        kind: 'badge',
        labelZh: 'AdamW',
        badgeKindZh: '训练期',
        moduleId: 'adamw_train',
      },
    ],
    highlightModuleIds: ['optimizer_update'],
    highlightNotesZh: ['开源包常见基线 Opt；具体 β/η/λ 见各模型公开配置。'],
  },
  {
    id: 'weight_decay',
    nameZh: 'Weight Decay',
    nameEn: 'Weight decay',
    accent: '#f59e0b',
    role: 'training',
    roleLabelZh: '训练期 · 公开超参',
    blurbZh:
      '解耦/权重衰减项。DeepSeek-V4 公开写明 AdamW 与 Muon 均使用 weight decay；其它开源配方亦常见。数值以原文为准。',
    source: {
      title: 'DeepSeek-V4 tech report (weight_decay); AdamW literature',
      year: 2026,
      noteZh: '来源：DeepSeek-V4 论文超参表；AdamW 公开定义。不外推未写明的衰减系数。',
      url: 'https://arxiv.org/abs/2606.19348',
    },
    attachments: [
      {
        targetId: 'optimizer_update',
        kind: 'badge',
        labelZh: 'WD',
        badgeKindZh: '训练期',
        moduleId: 'weight_decay',
      },
    ],
    highlightModuleIds: ['optimizer_update'],
    highlightNotesZh: ['Opt 旁路超参徽章，非新网络层。'],
  },
  {
    id: 'lr_cosine_warmup',
    nameZh: 'Warmup/Cosine',
    nameEn: 'Warmup + cosine / flat+cosine',
    accent: '#fbbf24',
    role: 'training',
    roleLabelZh: '训练期 · 公开日程',
    blurbZh:
      '公开常见学习率日程：warmup + cosine；或 warmup + 长平台 + 末段 cosine。DeepSeek-V4 论文明确后者。',
    source: {
      title: 'DeepSeek-V4 tech report (LR); Llama/Qwen/Mistral public training notes',
      year: 2026,
      noteZh: '来源：DeepSeek-V4 原文日程；Llama/Qwen/Mistral 公开报告中的常见日程表述。',
      url: 'https://arxiv.org/abs/2606.19348',
    },
    attachments: [
      {
        targetId: 'optimizer_update',
        kind: 'badge',
        labelZh: 'Warmup/Cosine',
        badgeKindZh: '训练期',
        moduleId: 'lr_cosine_warmup',
      },
    ],
    highlightModuleIds: ['optimizer_update'],
    highlightNotesZh: [
      'DeepSeek-V4：~2k linear warmup → 峰值平台 → 末段 cosine（公开）',
      '其它开源包：仅标注「常见公开日程族」，不编造曲线',
    ],
  },
  {
    id: 'lr_wsd',
    nameZh: 'WSD/Cooldown',
    nameEn: 'WSD / cooldown',
    accent: '#fcd34d',
    role: 'training',
    roleLabelZh: '训练期 · 公开概念',
    blurbZh:
      'Warmup–Stable–Decay / cooldown：公开文献中的日程词汇。可选对照；勿把未自称 WSD 的报告强行改名（V4 原文写 cosine 衰减）。',
    source: {
      title: 'Public WSD/cooldown discussions; contrast DeepSeek-V4 cosine wording',
      year: 2024,
      noteZh: '来源：公开日程讨论；与 DeepSeek-V4 论文表述对照，不伪造 V4=WSD。',
    },
    attachments: [
      {
        targetId: 'optimizer_update',
        kind: 'badge',
        labelZh: 'WSD',
        badgeKindZh: '训练期',
        moduleId: 'lr_wsd',
      },
    ],
    highlightModuleIds: ['optimizer_update'],
    highlightNotesZh: ['可选芯片；默认不塞进未写明 WSD 的模型包。'],
  },
  {
    id: 'mup_scaling',
    nameZh: 'μP',
    nameEn: 'μP (optional)',
    accent: '#a3e635',
    role: 'training',
    roleLabelZh: '训练期 · 可选公开理论',
    blurbZh:
      'Maximal Update Parametrization（公开理论）。可选笔记；除非模型卡/报告写明，否则不绑到具体开源包。',
    source: {
      title: 'Tensor Programs / μP (Yang et al., public)',
      year: 2022,
      noteZh: '来源：μP 公开论文；不声称 Llama/Qwen/DeepSeek/Kimi 默认启用。',
    },
    attachments: [
      {
        targetId: 'optimizer_update',
        kind: 'badge',
        labelZh: 'μP',
        badgeKindZh: '训练期',
        moduleId: 'mup_scaling',
      },
    ],
    highlightModuleIds: ['optimizer_update'],
    highlightNotesZh: ['可选挂点；不自动随模型包打开。'],
  },
  {
    id: 'mxfp4_qat',
    nameZh: 'MXFP4 QAT',
    nameEn: 'MXFP4 QAT',
    accent: '#e879f9',
    role: 'training',
    roleLabelZh: '训练期 · K3 公开后训练',
    blurbZh:
      'Kimi K3 公开：SFT 起 QAT；专家权重 MXFP4、激活 MXFP8。来源：K3 技术报告与 HF 模型卡。',
    source: {
      title: 'Kimi K3 tech report § MXFP4 QAT; moonshotai/Kimi-K3 HF card',
      year: 2026,
      noteZh: '来源：arxiv.org/abs/2607.24653 与 Hugging Face 模型卡「Native MXFP4」。',
      url: 'https://arxiv.org/abs/2607.24653',
    },
    attachments: [
      {
        targetId: 'optimizer_update',
        kind: 'badge',
        labelZh: 'MXFP4 QAT',
        badgeKindZh: '训练期',
        moduleId: 'mxfp4_qat',
      },
      {
        targetId: 'loss',
        kind: 'badge',
        labelZh: 'QAT',
        badgeKindZh: '训练期',
        moduleId: 'mxfp4_qat',
      },
    ],
    highlightModuleIds: ['optimizer_update', 'loss'],
    highlightNotesZh: ['仅 K3 包自动打开；复述公开 QAT 描述，无自造精度数字。'],
  },
]

export const OVERLAY_BY_ID = Object.fromEntries(
  OVERLAYS.map((o) => [o.id, o]),
) as Record<string, OverlayLayer>
