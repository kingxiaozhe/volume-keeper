# Volume Keeper (MVP v0.1.0)

按站点记忆音量的音量增强插件。重写自 Volume Master,差异化:**全屏不坏 + 按站点自动记忆 + 平滑不爆音**。

## 在你自己的 Chrome 里加载（手动）

> 命令行 `--load-extension` 在 Chrome 137+ 已被禁用,但用户手动"加载已解压"不受影响。

1. 打开 `chrome://extensions`
2. 右上角打开 **开发者模式 / Developer mode**
3. 点 **加载已解压的扩展程序 / Load unpacked**,选这个 `extension/` 目录
4. 工具栏出现 Volume Keeper 图标,点开即用

## 验收点（3 个 P0 + EQ）

- **全屏**:在 YouTube boost 到 200%+,按播放器全屏 → 应能进入真全屏(原版到这里就坏)。
- **按站点记忆**:在某站点调好音量,关标签页重开 / 刷新 → 音量自动恢复(无需任何操作)。
- **不爆音**:从 100% 猛拉到 400% → 平滑过渡,不应有突然炸响。
- **EQ**:Voice / Bass 预设(对标原版的人声/低音增强)。

## 已知限制（MVP 阶段,后续迭代）

- **DRM 站点**(Netflix / Disney+ / Spotify):Web Audio 取不到受保护音频,可能无效。这是注入路线的固有限制,后续考虑混合方案。
- 仅处理 DOM 里的 `<video>/<audio>`;动态 `new Audio()` 暂未代理(竞品 Sound Adjustment 有做,后续可加)。
- 仅 Chrome。

## 结构

- `manifest.json` — MV3,声明式 content script 注入所有 http/https 页(隔离世界)。`key` 钉死扩展 ID。
- `content.js` — 音频引擎:`createMediaElementSource → gain → biquad(EQ) → destination`,按 origin 持久化 + 平滑增益。
- `popup.html` / `popup.js` — 滑块 + EQ 预设 + 重置。

测试见仓库根的 `src/extension-smoke.mjs`(端到端)和 `src/spike-test.mjs`(音频放大验证)。
