# Volume Keeper (v0.2.0)

按站点记忆音量的音量增强插件。重写自 Volume Master,差异化:**全屏不坏 + 按站点自动记忆 + 平滑不爆音 + 防失真**。

## 在你自己的 Chrome 里加载（手动）

> 命令行 `--load-extension` 在 Chrome 137+ 已被禁用,但用户手动"加载已解压"不受影响。

1. 打开 `chrome://extensions`
2. 右上角打开 **开发者模式 / Developer mode**
3. 点 **加载已解压的扩展程序 / Load unpacked**,选这个 `volume-keeper/` 目录
4. 工具栏出现 Volume Keeper 图标,点开即用

## 功能 / 验收点

- **音量 0–600%**:滑块拖动,或**鼠标滚轮**在滑块上微调(每格 5%)。
- **全屏不坏**:YouTube boost 到 200%+,播放器全屏 → 真全屏(原版到这就坏)。
- **按站点记忆**:某站点调好音量,刷新 / 重开标签页 → 自动恢复。
- **全局默认**:勾选 "Use these settings for new sites",新站点自动套用当前设置(对标"想要每个标签页默认 >100%")。
- **不爆音**:100% 猛拉到 400% → `setTargetAtTime` 平滑过渡。
- **防失真(限幅)**:`Anti-distortion` 开关(默认开),高增益时压住峰值,缓解"过度增益失真"。
- **EQ**:Voice(人声 +12dB@1.5k)/ Bass(低音 +6dB@350)预设。

## 已知限制（后续迭代）

- **DRM 站点**(Netflix / Disney+ / Spotify):Web Audio 取不到受保护音频,无效。注入路线的固有限制,后续考虑混合方案。
- **动态 `new Audio()`**(不进 DOM 的音频):暂未代理。**注:试过把引擎搬到 MAIN world 来支持它,但 MAIN world 的 `createMediaElementSource` 会与页面自身的 Web Audio 冲突、直接搞坏 YouTube 放大,故放弃。** 只处理 DOM 里的 `<video>/<audio>`(含动态插入 + 同源 iframe)。
- 仅 Chrome。

## 结构

- `manifest.json` — MV3,声明式 content script 注入所有 http/https 页。**刻意用隔离世界**(独立 realm,不与页面自身 Web Audio 冲突,这是 YouTube 能放大的关键)。`key` 钉死扩展 ID。
- `content.js` — 音频引擎:`createMediaElementSource → gain → biquad(EQ) → limiter → analyser → destination`,按 origin 持久化(站点优先,回退全局默认)+ 平滑增益 + 限幅。
- `popup.html` / `popup.js` — 滑块 + 滚轮 + EQ 预设 + 限幅开关 + 设为默认 + 重置。

测试:仓库根 `src/extension-smoke.mjs`(端到端:消息往返 / 持久化 / **RMS 不静音护栏** / 播放未断)、`src/spike-test.mjs`(隔离世界音频放大验证)。
