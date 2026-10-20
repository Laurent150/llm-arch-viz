/** Sidebar grouping for overlay chips — fused on shared baseline, not parallel maps. */
export const OVERLAY_GROUPS: {
  id: string
  titleZh: string
  /** Short label when sidebar is collapsed to rail */
  railZh: string
  overlayIds: string[]
}[] = [
  {
    id: 'position',
    titleZh: '位置编码',
    railZh: '位置',
    overlayIds: ['rope', 'partial_rope', 'yarn_ntk'],
  },
  {
    id: 'attention',
    titleZh: '注意力',
    railZh: 'Attn',
    overlayIds: ['mqa_gqa', 'mla', 'sliding_window', 'csa_hca', 'kda', 'qk_norm'],
  },
  {
    id: 'ffn',
    titleZh: 'FFN / MoE',
    railZh: 'FFN',
    overlayIds: ['moe', 'swiglu', 'situ_glu', 'latent_moe'],
  },
  {
    id: 'norm',
    titleZh: '归一化 / 残差',
    railZh: 'Norm',
    overlayIds: ['rmsnorm', 'mhc', 'attn_res'],
  },
  {
    id: 'inference',
    titleZh: '推理期',
    railZh: '推理',
    overlayIds: ['kv_cache', 'flash_attn', 'paged_attn'],
  },
  {
    id: 'training',
    titleZh: '训练期技巧',
    railZh: '训练',
    overlayIds: [
      'amp_precision',
      'grad_accum',
      'act_checkpoint',
      'dist_parallel',
      'muon_opt',
      'adamw_train',
      'weight_decay',
      'lr_cosine_warmup',
      'lr_wsd',
      'mup_scaling',
      'mxfp4_qat',
    ],
  },
  {
    id: 'finetune',
    titleZh: '微调叠加',
    railZh: '微调',
    overlayIds: ['lora_qlora'],
  },
  {
    id: 'multimodal',
    titleZh: '多模态',
    railZh: '多模',
    overlayIds: ['multimodal'],
  },
]
