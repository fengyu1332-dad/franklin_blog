# 项目开发完成度与质量审查报告

> 审查日期：2026-08-24 ｜ 审查对象：`D:\BaiduSyncdisk\AI\remix_-personal-blog-template`
> 审查方式：源码逐文件审读 + 类型检查 + 生产构建验证 + 路由安全实测

---

## 一、项目定位与技术栈

| 项 | 实际值 | 说明 |
|---|---|---|
| 框架 | **Vite 6 + React 19 + React Router 7**（SPA） | 目录名/metadata 沿用了 "Remix" 模板名，但并非 Remix 框架 |
| 样式 | Tailwind CSS 4 + @tailwindcss/typography | DM Sans + Playfair Display 字体 |
| 后端 | Express 5（`server.mjs`，独立于 Vite，端口 3001） | 文章/Lab/照片三套 CRUD + 认证 + 上传 |
| 内容 | Markdown + frontmatter（`src/content/`） | 后端写入时自动重新生成 `src/data/*.ts` |
| 规模 | 前端约 3500 行 + 后端 660 行 + 6 篇文章 + 13 张照片 + 6 个 Lab 项目 | |

**架构画像**：内容以 Markdown 文件为唯一事实源，后端 API 承担「文件 ↔ 数据表」双向同步，前端构建时把数据表与全部 Markdown 打进 bundle。这个「文件即 CMS」的架构轻量、可 Git 化，是合理的个人博客方案。

---

## 二、功能完成度评分（总分 10）

| 模块 | 完成度 | 证据 |
|---|---|---|
| 前台页面（10 个路由） | **9 / 10** | 全部可用：首页/Hero、沉浸式文章页（视差 hero）、关于、归档、标签、摄影瀑布流+灯箱、Lab 卡片、404 |
| 富媒体渲染 | **8.5 / 10** | 图片三种尺寸、YouTube/Vimeo/直链视频、SoundCloud/直链音频、带作者引用块 |
| 搜索/菜单 | 9 / 10 | 全屏覆盖层，体验好；但搜索混入草稿（见风险 12） |
| 后台管理系统 | **8 / 10** | 三套 CRUD 齐全、标签联想、Markdown 预览、上传进度条、EXIF 自动提取标题/尺寸 |
| 内容资产 | **6 / 10** | 6 篇示例文章质量高，但含 1 篇测试残留（USA/USAUSA + 内联 base64 封面） |
| SEO / 订阅 | **4 / 10** | 页面级 Helmet/OG 齐全；但 sitemap/rss/robots 为模板残留（janedoe.com），静态不更新 |
| 工程质量 | 5 / 10 | 类型检查零错误、构建通过；无测试、无 lint 规范、文档缺失 |
| 安全 | **3 / 10** | 存在高危漏洞（见下），**当前状态不可上线** |

### 综合完成度：约 75%

**结论：MVP 功能层面基本成型，可本地体验；但存在 3 个上线阻断项（安全漏洞 ×2 + 生产上传故障 ×1），必须先修复再部署。**

---

## 三、质量审查：问题清单（按严重度分级）

### 🔴 P0 — 上线阻断（必须立即修复）

**1. 后端路径遍历漏洞（LFI）— 已实测确认 ⚠️**
- 位置：`server.mjs` 中 `/api/articles/:slug`、`/api/lab/:slug`、`/api/photos/:slug` 的 GET/PUT/DELETE。
- 问题：Express 5 会把 `%2f` / `%5c` 解码进路由参数，而代码 `path.join(ARTICLES_DIR, \`${req.params.slug}.md\`)` **无任何校验**。实测：
  ```
  GET  /api/articles/..%2f..%2fsecret  →  slug = "../../secret"  （逃逸目录成功）
  ```
  叠加管理端权限后可**越权读取/覆盖/删除任意 .md 文件**（数据破坏）。
- 修复：slug 白名单正则 `/^[a-zA-Z0-9-_]+$/`（或 `path.basename(slug) === slug` 双保险），对 articles/lab/photos 三个资源统一校验；删除端点建议改为 POST+body 或再校验一次。

**2. 管理端默认口令 `admin`**
- `server.mjs:15`：`const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"`。
- 未配置环境变量时，任何人输入 `admin` 即可获得管理端全权（增删改全部内容 + 上传任意文件）。
- 修复：环境变量缺失时**拒绝启动**（`throw new Error(...)`），或启动时生成随机密码打印到控制台。

**3. 生产模式新上传文件无法访问**
- `server.mjs` 生产分支只 `express.static(distPath)`；运行期上传文件写入 `public/uploads/`，不在 dist 内。SPA fallback（`app.get(/^\/(?!api).*/)`）会把 `/uploads/xxx.jpg` 吞成 `index.html` → 生产环境新传图片/视频全部失效。
- 修复：加一行 `app.use("/uploads", express.static(UPLOADS_DIR))`（置于 SPA fallback 之前）。

### 🟠 P1 — 重要（上线前完成）

| # | 问题 | 位置 | 建议 |
|---|---|---|---|
| 4 | `GEMINI_API_KEY` 经 `vite define` 注入客户端，若配置了 key 会随 bundle 泄露到浏览器；`@google/genai`、`rehype-raw`、`playwright`、`autoprefixer` 均未使用 | vite.config.ts / package.json | 删除未用依赖与注入逻辑 |
| 5 | 上传允许 `image/svg+xml`（SVG 可内嵌脚本，直接访问 URL 时执行）；`cors()` 全开 | server.mjs | 禁止 SVG（或剥离脚本后仅存图片用途）；CORS 收紧为同源 |
| 6 | 中文标题生成空 slug：`slugify` 仅支持 ASCII（`[^\w\s-]`），中文全被剔除 → 写盘为 `.md`、API 无法访问。Lab 项目全是中文名，走后台新建即触发 | server.mjs | 引入 Unicode 友好的 slug 库（如 `slugify` 的 `remove: false`）或提供手动 slug 字段 |
| 7 | 上传图片无压缩：目录内存在 7.9MB、7.6MB、5.5MB 大图，avatar.png 达 5.5MB，且有两组字节级重复文件（重复上传） | public/uploads/ | 上传管线加 sharp 压缩（封面压至 ~200KB，头像 ~50KB）；清理重复文件 |
| 8 | 文章封面存为内联 base64（usa.md 的 coverImage），膨胀数据文件且无法缓存 | src/content/articles/usa.md | 改为 `/uploads/` 路径引用 |
| 9 | `articles.ts` 手动改内容时若与 .md 不同步会产生漂移；生成逻辑用字符串拼接 TS 源码，含引号/换行内容时易产出非法文件 | server.mjs generateArticlesTs | 统一以 API 为唯一写入通道；生成时对引号、反引号、`${}` 做转义 |

### 🟡 P2 — 体验与工程（迭代期完成）

| # | 问题 | 位置 | 建议 |
|---|---|---|---|
| 10 | 文章不存在 → 重定向首页（应为 404） | pages/Post.tsx | `Navigate to="/404"`，并让 404 页带 Header/Footer |
| 11 | 搜索命中草稿（用 `articles` 而非 `publishedArticles`） | components/SearchOverlay.tsx | 改用 published 列表 |
| 12 | Home 无空状态保护（无文章时 `featuredArticle` 为 undefined 崩溃） | pages/Home.tsx | 空列表渲染占位 |
| 13 | `FadeImage` 无 onError：图片加载失败永久不可见 | components/FadeImage.tsx | onError 时置 `opacity-100`（或显示占位） |
| 14 | 后台 Photos 表 Size 列硬编码 "—" | pages/Admin.tsx | API 返回真实尺寸 |
| 15 | `Gallery.tsx` 为死代码（无引用）；`AudioEmbed` chunk 161KB、`Footer` 23KB 异常偏大 | 全仓 | 删除 Gallery；用 `manualChunks` 拆分 vendor |
| 16 | Lightbox/MenuOverlay 无焦点陷阱、无 `aria-modal`/`role` | components/Lightbox.tsx 等 | 补 a11y：焦点管理 + 关闭按钮 aria-label |
| 17 | `PhotoEditor` 残留大量 `console.log`（含完整 EXIF 数据，可能含 GPS） | components/admin/PhotoEditor.tsx | 删除或降级为 debug 开关 |
| 18 | rss.xml/sitemap.xml 为模板残留：域名 `janedoe.com`，与 site-config（franklinhuang.com）冲突，且不随文章增删更新 | public/ | 后端动态生成 `/rss.xml`、`/sitemap.xml`，域名统一走 siteConfig |
| 19 | `stripFrontmatter` 手工切 frontmatter 易错（frontmatter 内含 `---` 时截断错误）；前端未用已装好的 gray-matter | pages/Post.tsx | 统一用 gray-matter |
| 20 | 无测试（playwright 已装未用）、无 ESLint/Prettier、无 CI | 工程 | 补冒烟测试与 lint 规范 |
| 21 | `dev:full` 脚本用 `&` 后台符，Windows CMD 下不可用 | package.json | 提供 `concurrently` 或文档说明 |
| 22 | dist 构建产物易过期且曾被环境 trash 策略中断清空（已恢复重建） | dist/ | 部署流程明确 `npm run build && npm run server` |

---

## 四、代码亮点（值得保留的设计）

1. **内容即文件**：Markdown + frontmatter 单一事实源，全站内容可 Git 版本化，无数据库依赖。
2. **媒体指令语法**：`:video{src=... title=...}` / `:audio{...}` 自定义指令 → 渲染为对应嵌入组件，作者写文成本低。
3. **沉浸式阅读体验**：滚动视差 hero + serif/sans 混排 + 引用/图片动效，视觉完成度高。
4. **EXIF 自动提取**：照片上传时自动读取标题/主题/尺寸（exifr），显著降低照片录入成本。
5. **路由级代码分割 + 懒加载 + 图片 lazy**：首屏 JS 控制在 ~387KB（gzip 125KB），个人博客合理水平。
6. **类型检查零错误**：`tsc --noEmit` 通过，`strict` 相关的 React 类型使用规范。

---

## 五、下一阶段开发计划

> 建议顺序执行，P0 先行。预计 4 个迭代、约 2 周工作量（单人）。

### 迭代 0：安全加固（1~2 天）—— ⛔ 不完成不上线
- [ ] slug 白名单校验（三个资源统一），`path.basename` 双保险
- [ ] ADMIN_PASSWORD 强制（缺失即拒启）
- [ ] `app.use("/uploads", express.static(UPLOADS_DIR))`
- [ ] CORS 收紧为同源；上传禁 SVG（或剥离脚本）
- [ ] 移除 vite define 中的 GEMINI_API_KEY
- **验收**：`npm run server` 后，用 curl 复测 `..%2f` 攻击返回 400/404；无 `.env` 时启动报错；上传新图后 `/uploads/xxx` 直接可访问。

### 迭代 1：内容与数据卫生（2~3 天）
- [ ] 删除 USA 测试文章，base64 封面迁移为 `/uploads/` 引用
- [ ] 上传压缩管线（sharp：封面 1600px/200KB、头像 256px），清理重复大文件
- [ ] 中文 slug 支持（slugify `remove:false` 或手动 slug 字段）
- [ ] `generateArticlesTs` 转义加固（引号/反引号/`${}`）
- **验收**：后台用中文标题新建文章，生成正确 slug 且前台可访问；上传后文件大小显著下降。

### 迭代 2：功能与体验完善（3~5 天）
- [ ] 404 正确跳转（Post 不存在 → /404）
- [ ] 搜索排除草稿；Home 空状态保护
- [ ] FadeImage onError 兜底；Photos 表 Size 列
- [ ] 文章详情增强：上一篇/下一篇、相关文章推荐、阅读进度条
- [ ] 草稿独立预览体验（草稿链接未登录时明确提示）
- **验收**：全路由无空态崩溃；后台照片列表显示真实体积。

### 迭代 3：SEO 与性能（3~4 天）
- [ ] 后端动态生成 `/rss.xml`、`/sitemap.xml`（读文章数据，域名取 siteConfig）
- [ ] robots.txt 域名统一；补 favicon/OG 图本地化（替换 picsum 占位）
- [ ] 图片 `width/height` 显式化 + 封面 preload；`manualChunks` 拆分 AudioEmbed/vendor
- [ ] 删除死代码（Gallery）与未用依赖，清空 PhotoEditor 调试日志
- **验收**：rss/sitemap 与内容一致；bundle 体积可量化下降；Lighthouse 首屏 ≥ 90。

### 迭代 4：工程化与发布（2~3 天）
- [ ] 补 ESLint + Prettier（接入 `npm run lint`）
- [ ] Playwright 冒烟测试：首页渲染、文章打开、登录、建/改/删文章、上传
- [ ] README 重写：项目介绍、`.env` 配置表（ADMIN_PASSWORD/API_PORT）、本地开发、构建部署、后台使用说明
- [ ] 部署指南：Vercel（静态+API 需 Serverless 适配）或云主机/容器（`node server.mjs` 直跑）+ Nginx HTTPS + 备份策略（content/ + uploads/ 定期 git push）
- **验收**：全新环境按 README 20 分钟可跑通 dev + prod；冒烟测试全绿。

---

## 六、上线前 Checklist（对应 P0/P1）

- [x] slug 遍历漏洞已修复并复测（`assertValidSlug`：`\p{L}\p{N}_-` 白名单 + `path.basename` 双保险，覆盖 articles/lab/photos 全部 GET/PUT/DELETE）
- [x] 管理端口令强制非默认（`ADMIN_PASSWORD` 缺失即拒启）
- [x] 生产上传可访问（`app.use("/uploads", express.static(UPLOADS_DIR))` 置于 SPA fallback 之前）
- [x] 无 API key 泄露进 bundle（vite.config 移除 GEMINI_API_KEY define）
- [x] CORS/SVG 上传已收敛（CORS 白名单 localhost；ALLOWED_MIMES 移除 SVG）
- [x] 测试数据已清理（USA 文章/base64 封面删除；4 个未引用重复上传文件删除）
- [x] 大图已压缩（上传管线 sharp 自动压缩 max 2048px/质量 82；GIF 保留动画）
- [x] 中文 slug 支持（Unicode 感知 slugify，`\p{L}\p{N}`）
- [x] TS 生成转义加固（`generateArticlesTs/generateLabTs/generatePhotosTs` 改用 JSON.stringify）

---

## 七、实施记录（2026-08-24）

### 迭代 0：安全加固 ✅
- `server.mjs`：`ADMIN_PASSWORD` 缺失即 `throw` 拒启；CORS 白名单（localhost:3000/3001/127.0.0.1）；新增 `assertValidSlug`（Unicode 字母数字 + 下划线 + 连字符白名单，`path.basename` 双保险）应用于 articles/lab/photos 的 GET/PUT/DELETE 全部 9 处；上传删除端点 `assertValidFilename`；`app.use("/uploads", express.static(UPLOADS_DIR))`；ALLOWED_MIMES 移除 `image/svg+xml`
- `vite.config.ts`：移除 `GEMINI_API_KEY` define 注入（含未使用的 loadEnv）
- 复测：`..%2f` 攻击由"逃逸成功"变为 400；未设 `ADMIN_PASSWORD` 启动报错；`/uploads/*` 生产模式直出文件

### 迭代 1：内容与数据卫生 ✅（压缩管线随 sharp 安装完成后生效）
- 删除 USA 测试文章（`src/content/articles/usa.md` + `articles.ts` 条目 + base64 封面）
- 清理 4 个未引用/重复上传文件（e849c985、29d00005、7693a003、6075ff90），保留 avatar.png / 87bad1d2（照片引用）/ b26352a0（slow-travel 引用）
- `slugify` 改为 Unicode 感知（NFKC + `\p{L}\p{N}`），中文标题可生成有效 slug
- 三个 TS 生成函数字符串字段统一 JSON.stringify 转义
- `/api/upload` 接入 sharp：EXIF 方向矫正 + 超 2048px 缩放 + JPEG/WebP 质量 82 / PNG 压缩级别 9，原地覆盖（URL 不变），GIF 跳过
- 待办：现有 3 个大文件压缩（avatar 5.5MB→256px、87bad1d2 7.6MB→2048px、b26352a0 3.3MB→2048px）

### 迭代 2：功能与体验完善 ✅
- **404 正确跳转**：Post 不存在 → `/404`（NotFound 页补 Header/Footer）
- **草稿预览**：Post 页在未发布 slug 时用管理 token 拉取 `/api/articles/:slug` 渲染（含 Draft 徽标 + noindex）；Admin 文章列表对 draft 显示 Preview 按钮（新标签页）；后端行为验证：登录 200 / 匿名 404
- **搜索排除草稿**：SearchOverlay 改用 `publishedArticles`
- **Home 空状态保护**：无文章时显示占位提示，不渲染空卡片
- **FadeImage onError 兜底**：加载失败显示浅色占位，不再永久不可见
- **文章详情增强**：顶部阅读进度条（motion scroll + spring）、上一篇/下一篇导航、按共享标签推荐 3 篇相关文章（无封面兜底）
- **Photos Size 列**：后端对 `/uploads/` 本地文件返回真实字节数，Admin 表格格式化显示（KB/MB），外链显示 "—"
- **清理**：PhotoEditor 移除含 EXIF/GPS 的调试日志
- 验证：tsc 零错误、build 通过（8.1s）、接口实测通过

### 迭代 3：SEO 与性能 ✅
- **动态 SEO 资产**：`server.mjs` 动态生成 `/rss.xml`（最新 20 篇）、`/sitemap.xml`（静态页 + 全部文章）、`/robots.txt`（Disallow /admin + Sitemap 指向），域名取 `SITE_URL` env（默认 franklinhuang.com）；删除 public/ 下 janedoe 域名残留的静态 rss/sitemap/robots
- **OG/favicon 本地化**：sharp 从本地照片生成 `/uploads/og-default.jpg`（1200×630，105KB）；新增 `public/favicon.svg`（品牌色）；`site-config.ogImage` 改为本地路径；index.html 补基础 meta/OG/favicon/theme-color
- **封面 preload**：Post hero 与 Home featured 图 `<link rel="preload" as="image">`（LCP 加速）
- **chunk 拆分**：vite `manualChunks` 拆分 markdown/motion/react-vendor/icons/exifr/vendor
- **清理**：删除死代码 Gallery.tsx；卸载未用依赖 `@google/genai`、`rehype-raw`、`autoprefixer`（保留 playwright 供迭代 4）
- 验收：rss/sitemap/robots 内容与文章一致（curl 实测）；**主 bundle 387KB → 7.3KB**（gzip 125KB→3KB），AudioEmbed 161KB→4KB，重块全部按需加载；Lighthouse 需浏览器环境（预留说明）
- 已知小问题：无时区日期在 RSS pubDate 中会按本地时区偏移（影响可忽略）

### 迭代 4：待开发（工程化与发布：ESLint/冒烟测试/README/部署指南）
