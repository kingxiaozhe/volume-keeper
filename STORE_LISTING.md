# Chrome Web Store 上架逐字稿（Volume Keeper）

把下面内容直接复制到 Developer Dashboard 对应字段。

## 基本信息

- **Name**: Volume Keeper
- **Category**: Tools（或 Accessibility，二选一；建议 Tools）
- **Language**: English (United States)

## Summary（短描述，≤132 字符）

```
Boost or lower any site's volume up to 600% — remembers your level per site, never breaks fullscreen, and won't blast your ears.
```

## Detailed description（详情）

```
Volume Keeper gives you precise control over the sound of any website — boost quiet videos up to 600%, or turn down a too-loud tab — and it remembers the level you picked for each site automatically.

WHY IT'S DIFFERENT
• Never breaks fullscreen. Many volume boosters stop YouTube and other players from going fullscreen. Volume Keeper doesn't — it leaves the page's player untouched.
• Remembers every site. Set a site once; Volume Keeper restores that volume every time you come back. You can also set a default level for all new sites.
• No sudden blasts. Volume changes ramp smoothly instead of jumping, so you won't get a painful spike of sound.
• Anti-distortion. A built-in limiter tames the harsh clipping you get when boosting too hard (toggle it off if you prefer).
• Voice & Bass presets. Make speech clearer or add low-end warmth.
• Scroll to fine-tune. Hover the slider and scroll to nudge the volume in small steps.

PRIVACY
No accounts, no tracking, no data leaves your device. Your volume settings are stored locally in your browser. See the privacy policy linked below.

NOTES
• Works on standard HTML5 audio/video. DRM-protected players (e.g. Netflix, Disney+, Spotify) cannot be amplified due to browser restrictions.
• Chrome only.
```

## Single purpose（单一用途说明）

```
Adjust and remember the audio playback volume of websites.
```

## Permission justifications（权限理由）

- **storage**:
```
Used to save the user's chosen volume and equalizer setting for each website so it can be restored automatically on the next visit. Stored locally only.
```

- **Host permissions `<all_urls>`**:
```
The extension adjusts the volume of audio/video on whatever website the user is currently on. Because the user can request volume control on any site, it needs to run on all sites. It only accesses media elements to route their audio through a volume control; it does not read page content, cookies, or browsing history, and transmits nothing.
```

## Data usage disclosures（数据用途，dashboard 勾选）

- 是否收集用户数据：**否（None）**。全部勾"不收集"。
- 三项合规声明(都要勾):
  - 不出售/不转让用户数据给第三方
  - 不将数据用于与单一用途无关的用途
  - 不用于判定信用/借贷资格

## Privacy policy URL（隐私政策链接）

```
https://kingxiaozhe.github.io/volume-keeper/privacy.html
```
> 需先在仓库开启 GitHub Pages(Settings → Pages → Source: main /docs)。
> ⚠️ 私有仓库的 GitHub Pages 需要付费套餐(Pro)。若不想升级:把本仓库设为公开,
> 或单独建一个公开仓库放 docs/privacy.html。

## 还需你自备

- **截图**：≥1 张,1280×800 或 640×400。我已准备一张 popup 效果图(见 store-assets/)。
- 一次性 $5 开发者注册费(你的 Google 账号在 dashboard 完成)。
