# 大模型架构可视化 · LLM Arch Viz（V1）

教学向的交互式 Transformer / LLM 架构浏览器：一张**居中基线流水线**，可选/可替代方案以叠加层挂在对应节点上；可另开**训练视角**查看反向传播路径。

> **范围声明**：仅基于公开论文、技术报告与开源模型卡。不声称复刻任何公司未公开内部实现。  
> **V2**：预留「从论文生成 Diff」接口，**不含**自动 PDF 解析。

## 如何运行

```bash
npm install
npm run dev
```

浏览器打开终端提示的地址（默认 `http://localhost:5173`）。

```bash
npm run build && npm run preview
```

## 交互说明（重要）

1. **基线 / 通常都有**：Token → Embedding(+Pos) → Block×N（Attention / FFN / Norm）→ LM Head。主图始终显示，节点带「基线」标签。
2. **叠加层（可选 / 可替代）**：RoPE、MQA/GQA、MoE、多模态、KV Cache。可多选开关，但**打开只是高亮该变体，不等于模型同时拥有全部变体**。
   - **RoPE**：位置编码的一种选法（替代绝对 PE）
   - **MQA/GQA**：替代标准多头 K/V 布局
   - **MoE**：替代（或部分替代）稠密 FFN
   - **多模态**：可选附加视觉分支
   - **KV Cache**：推理期路径，不是训练结构层
3. **训练视角（默认关）**：打开后在流水线下方显示虚线反向路径：`loss ← logits/LM Head ← blocks ← embed ← 更新参数`。
   - 带 **「训练期」** 徽章；**不属于推理架构**
   - 与 **KV Cache（推理）** 不同：梯度沿计算图反向；优化器（AdamW / Muon 等）只在「更新参数」一步
   - 可点：**损失函数**、**反向传播 / 梯度**、**更新参数**
4. 图上徽章：**可选** / **替代** / **推理期** / **训练期**；挂在正确节点旁，不做蜘蛛网全连线。
5. **详情面板**：中文说明、公式、张量形状；`Esc` 关闭。
6. **族谱卡片**：次要参考，在流水线下方。
7. **深浅色主题**。

## 数据文件

| 路径 | 内容 |
|------|------|
| `src/data/modules.ts` | 模块说明、公式、张量形状（含训练期节点） |
| `src/data/overlays.ts` | 可选/可替代叠加层 + 挂点 |
| `src/data/variants.ts` | V2 兼容的变体扁平列表 |
| `src/data/families.ts` | 族谱卡片与来源 |

## V2 扩展点（已预留，未实现）

### 类型 · `src/types/paperDiff.ts`

- `PaperContribution` / `ArchitectureDiff` / `EvidenceSpan` / `ReviewStatus`
- `PaperMetaInput`：提议 Diff 时的元数据输入

### API 桩 · `src/api/paperDiff.ts`

| 函数 | V1 行为 |
|------|---------|
| `proposeDiffFromPaper(meta)` | 抛出 `NotImplementedError` |
| `listPendingDiffs()` | 返回 `[]` |
| `applyApprovedDiff(id)` | 抛出 `NotImplementedError` |
| `rejectDiff(id, note?)` | 抛出 `NotImplementedError` |

### UI

页面底部 **「从论文生成 Diff · 即将推出」**：说明人工审核流程，试调按钮触发 API 桩，**不会伪造解析结果**。

## 技术栈

- Vite + React 19 + TypeScript
- KaTeX（公式）
- 无后端；纯静态数据

## 免责声明

本项目用于自学与面试准备。架构图为教学抽象；公司卡片仅列公开特征；训练视角为教学示意。请以原始论文与官方模型卡为准。
