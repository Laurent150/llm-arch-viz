import type { ModelFamilyCard } from '../types/architecture'

/**
 * Open / public model family cards + fused overlay packs.
 * Selecting a pack enables the listed overlay ids on the shared baseline
 * (badges on Embed/Attn/FFN/Norm) — NOT a parallel spider-web diagram.
 * ONLY publicly documented traits + sources.
 */
export const FAMILIES: ModelFamilyCard[] = [
  {
    id: 'llama',
    nameZh: 'Llama 3 系',
    nameEn: 'Llama 3-class',
    packAccent: '#60a5fa',
    overlayPackIds: ['rope', 'mqa_gqa', 'swiglu', 'rmsnorm'],
    trainingPackIds: ['adamw_train', 'weight_decay', 'lr_cosine_warmup'],
    traitsZh: [
      'Decoder-only · Pre-Norm / RMSNorm',
      '公开配方：RoPE + GQA + SwiGLU FFN',
      '训练侧公开常见：AdamW 类优化器 + warmup/cosine 等日程（见训练视角）',
      '点击本卡 → 结构叠加 + 训练期方法徽章',
    ],
    sources: [
      {
        title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models',
        year: 2023,
        url: 'https://arxiv.org/abs/2307.09288',
      },
      {
        title: 'The Llama 3 Herd of Models (public report)',
        year: 2024,
        url: 'https://arxiv.org/abs/2407.21783',
      },
    ],
  },
  {
    id: 'qwen',
    nameZh: 'Qwen 2 / 2.5 系',
    nameEn: 'Qwen 2/2.5-class',
    packAccent: '#a78bfa',
    overlayPackIds: ['rope', 'mqa_gqa', 'swiglu', 'rmsnorm'],
    trainingPackIds: ['adamw_train', 'weight_decay', 'lr_cosine_warmup'],
    traitsZh: [
      '公开报告：RoPE、SwiGLU、RMSNorm、GQA（部分规模/变体）',
      'Qwen 系另有 MoE 等变体——需要时再手动打开「MoE」叠加',
      '训练侧：公开配方常见 AdamW 类 + 学习率日程（训练视角徽章）',
      '点击本卡 → 结构叠加 + 训练期方法徽章',
    ],
    sources: [
      {
        title: 'Qwen Technical Report',
        year: 2023,
        url: 'https://arxiv.org/abs/2309.16609',
      },
      {
        title: 'Qwen2 Technical Report (public)',
        year: 2024,
        url: 'https://arxiv.org/abs/2407.10671',
      },
    ],
  },
  {
    id: 'deepseek',
    nameZh: 'DeepSeek V2/V3 系',
    nameEn: 'DeepSeek V2/V3-class (MLA)',
    packAccent: '#fb7185',
    overlayPackIds: ['rope', 'mla', 'moe', 'rmsnorm', 'swiglu'],
    trainingPackIds: ['adamw_train', 'weight_decay', 'lr_cosine_warmup'],
    traitsZh: [
      '公开报告：MLA（潜在压缩注意力）挂在 Attention',
      'DeepSeekMoE 等稀疏 FFN 挂在 FFN（替代稠密）',
      '训练侧（V2/V3 公开脉络）：AdamW 类为主；Muon 见 V4 包',
      '点击本卡 → 结构叠加 + 训练期方法徽章',
    ],
    sources: [
      {
        title: 'DeepSeek-V2 Technical Report',
        year: 2024,
        url: 'https://arxiv.org/abs/2405.04434',
      },
      {
        title: 'DeepSeek-V3 Technical Report (public)',
        year: 2024,
        url: 'https://arxiv.org/abs/2412.19437',
      },
    ],
  },
  {
    id: 'deepseek-v4',
    nameZh: 'DeepSeek-V4 系',
    nameEn: 'DeepSeek-V4-class',
    packAccent: '#e879f9',
    overlayPackIds: ['csa_hca', 'mhc', 'partial_rope', 'moe', 'swiglu', 'rmsnorm'],
    trainingPackIds: ['muon_opt', 'adamw_train', 'weight_decay', 'lr_cosine_warmup'],
    traitsZh: [
      '公开预览：CSA/HCA 混合压缩注意力（不是 MLA）',
      'mHC 替代 plain residual；Partial RoPE；仍用 DeepSeekMoE',
      '训练公开：多数矩阵用 Muon，Embedding/Head/RMSNorm/mHC 门控等仍 AdamW',
      '日程公开：线性 warmup → 长平台 → 末段 cosine 衰减（见训练徽章）',
    ],
    sources: [
      {
        title: 'DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence',
        year: 2026,
        url: 'https://arxiv.org/abs/2606.19348',
      },
      {
        title: 'DeepSeek-V4 collection (Hugging Face)',
        year: 2026,
        url: 'https://huggingface.co/collections/deepseek-ai/deepseek-v4',
      },
    ],
  },
  {
    id: 'mistral',
    nameZh: 'Mistral 7B 系',
    nameEn: 'Mistral 7B-class',
    packAccent: '#2dd4bf',
    overlayPackIds: ['rope', 'mqa_gqa', 'sliding_window', 'swiglu', 'rmsnorm'],
    trainingPackIds: ['adamw_train', 'weight_decay', 'lr_cosine_warmup'],
    traitsZh: [
      '公开论文：GQA + Sliding Window Attention',
      'SwiGLU FFN · RMSNorm · RoPE',
      '训练侧公开常见：AdamW 类 + warmup/cosine 等（训练视角）',
      'Mixtral 等 MoE 变体请另开「MoE」叠加对照',
    ],
    sources: [
      {
        title: 'Mistral 7B',
        year: 2023,
        url: 'https://arxiv.org/abs/2310.06825',
      },
      {
        title: 'Mixtral of Experts (public paper)',
        year: 2024,
        url: 'https://arxiv.org/abs/2401.04088',
      },
    ],
  },
  {
    id: 'kimi',
    nameZh: 'Kimi 开源系 (K2)',
    nameEn: 'Moonshot Kimi K2-class',
    packAccent: '#f472b6',
    /** Public Kimi K2 / Moonlight-style: MLA + MoE + SwiGLU + RMSNorm + RoPE — NOT GQA */
    overlayPackIds: ['rope', 'mla', 'moe', 'rmsnorm', 'swiglu'],
    trainingPackIds: ['muon_opt', 'adamw_train', 'weight_decay', 'lr_cosine_warmup'],
    traitsZh: [
      '【K2】公开：MLA + 稀疏 MoE + SwiGLU（与下方 K3 包分开）',
      'RMSNorm · RoPE；公开称上下文可到约 128K（以模型卡为准）',
      '注意：公开表写的是 MLA，不是 GQA——本包不伪造 GQA',
      '训练侧公开：Muon 等优化器配方见训练视角徽章（非结构层）',
      'Kimi-VL 等另含 MoonViT：需要时再手动开「多模态」',
    ],
    sources: [
      {
        title: 'Kimi K2 (MoonshotAI GitHub / model card)',
        year: 2025,
        url: 'https://github.com/MoonshotAI/Kimi-K2',
      },
      {
        title: 'Kimi K2: Open Agentic Intelligence (public report)',
        year: 2025,
        url: 'https://arxiv.org/abs/2507.20534',
      },
      {
        title: 'moonshotai/Kimi-K2-Instruct (Hugging Face)',
        year: 2025,
        url: 'https://huggingface.co/moonshotai/Kimi-K2-Instruct',
      },
      {
        title: 'Kimi-VL Technical Report (MoonViT + MoE decoder)',
        year: 2025,
        url: 'https://arxiv.org/abs/2504.07491',
      },
    ],
  },
  {
    id: 'kimi-k3',
    nameZh: 'Kimi K3',
    nameEn: 'Moonshot Kimi K3',
    packAccent: '#fb7185',
    overlayPackIds: ['kda', 'mla', 'attn_res', 'latent_moe', 'situ_glu', 'rmsnorm'],
    trainingPackIds: ['muon_opt', 'adamw_train', 'weight_decay', 'lr_cosine_warmup', 'mxfp4_qat'],
    traitsZh: [
      '【K3】公开：KDA + Gated MLA 混合注意力（3:1 量级）',
      'AttnRes · Stable LatentMoE · SiTU-GLU；约 1M 上下文',
      '训练公开：Muon 等相关配方；后训练 MXFP4 QAT（专家权重）见训练徽章',
      '与「Kimi 开源系 (K2)」分开；多模态需时再开「多模态」',
    ],
    sources: [
      {
        title: 'MoonshotAI/Kimi-K3',
        year: 2026,
        url: 'https://github.com/MoonshotAI/Kimi-K3',
      },
      {
        title: 'Kimi K3: Open Frontier Intelligence',
        year: 2026,
        url: 'https://arxiv.org/abs/2607.24653',
      },
      {
        title: 'moonshotai/Kimi-K3 (Hugging Face)',
        year: 2026,
        url: 'https://huggingface.co/moonshotai/Kimi-K3',
      },
    ],
  },
  {
    id: 'gpt-public',
    nameZh: 'GPT 公开脉络',
    nameEn: 'GPT public lineage',
    /** No fused pack — pedagogical dense baseline only */
    traitsZh: [
      '从 GPT-2/3 等公开发表结构理解「稠密 Decoder」基线',
      '后续商用模型内部细节未公开——本工具只用公开论文级知识',
      '点击不强制叠加选件，保持纯基线对照',
    ],
    sources: [
      {
        title: 'Language Models are Unsupervised Multitask Learners (GPT-2)',
        year: 2019,
      },
      {
        title: 'Language Models are Few-Shot Learners (GPT-3)',
        year: 2020,
        url: 'https://arxiv.org/abs/2005.14165',
      },
    ],
  },
]

/** Packs that can be applied from LayerToggles (families with overlayPackIds) */
export const MODEL_PACKS = FAMILIES.filter(
  (f) => f.overlayPackIds && f.overlayPackIds.length > 0,
)
