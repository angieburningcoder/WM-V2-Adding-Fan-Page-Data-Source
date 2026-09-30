# Watchmen V2 — 社群媒體監測 UI Prototype

> **一句話說明**：這是 Watchmen V2「社群媒體監測（可疑粉絲頁／廣告）」頁面的**純前端畫面原型**。
> 不需要安裝任何東西、沒有後端、沒有資料庫，所有資料都是寫死的假資料。
> 用瀏覽器打開就能看、能點、能篩選、能匯出 CSV。

| 項目 | 內容 |
|---|---|
| 對應 PRD | [[WIP] Social Module_Fan Page Detection（Confluence）](https://gogolook.atlassian.net/wiki/spaces/BPC/pages/2118746136/WIP+Social+Module_Fan+Page+Detection) |
| UI Link | [UI Link ↗](https://angieburningcoder.github.io/WM-V2-Adding-Fan-Page-Data-Source/)（不需登入） |
| 部署方式 | **GitHub Pages**（免費、不用 build、不用資料庫）→ 見[第 7 節](#7-部署到-github-pages) |
| 原始 repo | https://github.com/angieburningcoder/WM-V2-Adding-Fan-Page-Data-Source |

---

## 目錄

1. [給主管：3 步驟打開來看](#1-給主管3-步驟打開來看)
2. [給主管：怎麼請 AI 幫你改](#2-給主管怎麼請-ai-幫你改)
3. [畫面上有什麼（功能導覽）](#3-畫面上有什麼功能導覽)
4. [業務規則與名詞定義](#4-業務規則與名詞定義)
5. [Prototype 的邊界（哪些是假的）](#5-prototype-的邊界哪些是假的)
6. [給 AI Agent：專案結構與修改指南](#6-給-ai-agent專案結構與修改指南)
7. [部署到 GitHub Pages](#7-部署到-github-pages)

---

## 1. 給主管：3 步驟打開來看

1. 把 zip 解壓縮到任意資料夾。
2. 在資料夾裡找到 **`index.html`**，用滑鼠**雙擊**（會用預設瀏覽器打開，建議 Chrome）。
3. 完成。畫面就是 Prototype 本體。

> 如果修改後重新整理，畫面**沒有變**：按 `Cmd + Shift + R`（Mac）或 `Ctrl + Shift + R`（Windows）強制重新整理。
> 在畫面上改過的狀態（例如把案件改成「已送件」）**重新整理後會還原**，這是正常的，因為沒有資料庫。

---

## 2. 給主管：怎麼請 AI 幫你改

你不需要會寫程式。把整個資料夾交給 AI 工具（例如 Claude Code），用**白話描述你想要的畫面改動**即可。

### 開場建議這樣說

```text
請先讀這個資料夾裡的 README.md，了解這份 UI prototype 的結構與規則。
這是靜態網頁 prototype，請維持目前的視覺風格與資訊架構，不要加入後端或安裝任何套件。
我想要調整的是：（在這裡寫你的需求）
改完後請告訴我改了哪些檔案、哪些地方，以及我要怎麼在畫面上看到改動。
```

### 需求描述範例（越具體越好）

| 想做的事 | 可以這樣說 |
| --- | --- |
| 改文字 | 「把表格標題『可疑社群廣告清單』改成『可疑粉絲頁清單』」 |
| 表格加欄位 | 「在主表格『處理狀態』後面加一欄『粉絲頁建立時間』，要能排序」 |
| 拿掉欄位 | 「主表格不要顯示『投放平台』這一欄」 |
| 加假資料 | 「幫我多加 3 筆假案件，其中 1 筆是高風險、雙來源命中、狀態是已受理」 |
| 改狀態 | 「新增一個處理狀態『待補件』，放在『已排程』之後，顏色用處理中的藍色」 |
| 加篩選 | 「工具列加一個『是否認證』的下拉篩選」 |
| 改顏色 | 「高風險的紅色換成深一點的紅」 |
| 改詳情抽屜 | 「案件詳情裡，把『風險判斷』區塊移到最上面」 |
| 改匯出 | 「CSV 匯出拿掉 Email 和 Phone 欄位」 |

### 小提醒

- 一次提一個需求、改完看畫面確認，再提下一個，比一次丟十個需求穩定。
- 看畫面時，記得強制重新整理（見上方）。
- 如果改壞了：有 git 的話可以請 AI「還原到上一個版本」；沒有 git 的話，**改之前先複製一份整個資料夾當備份**。

---

## 3. 畫面上有什麼（功能導覽）

整個網站只有**一個頁面**：「監測清單 → 社群媒體」。由上到下：

### 3.1 外框（左側選單、上方列）

- 左側選單、上方的使用者名稱（Angela Lin）、客戶切換（晴光）、登出按鈕，都是**裝飾用**，點了沒有作用。
- 左側選單可以收合（左上角按鈕）。
- 延續現有 `st.console` 產品的視覺風格。

### 3.2 摘要數字卡（4 張）

| 卡片 | 算法 |
| --- | --- |
| 可疑粉絲頁 | 目前篩選結果的案件數 |
| 高風險 | 其中偽冒風險 = High 的數量 |
| 雙來源命中 | 其中同時被 Fan Page 與 Meta Ads 偵測到的數量 |
| 關聯廣告 | 其中所有案件關聯廣告數加總 |

> 數字會**跟著篩選條件變動**。

### 3.3 工具列（搜尋與篩選）

- **搜尋框**：可一次輸入多個關鍵字（用空白、逗號、頓號分隔），**任一個命中就顯示**。
  比對範圍：粉絲頁名稱、粉絲頁編號、Case ID、廣告編號、廣告文案。
- **日期下拉**：點開可選「自／到」或快速捷徑（過去一週／一個月）。
  ⚠️ 目前日期**不會真的篩選資料**，只會用在 CSV 檔名上。
- **四個維度下拉**：資料來源（Fan Page／Meta Ads／雙來源命中）、偽冒風險程度、處理狀態、投放平台。
- **已套用條件 chips**：有套用篩選時，下方會出現小標籤，可個別移除或一鍵清除。
- **匯出**（表格右上角）：把「目前篩選後的結果」匯出成 CSV，一則廣告一列。

### 3.4 主表格（案件清單）

- **一列 = 一個粉絲頁（一個案件）**。不再區分「可忽略清單」，一律用「處理狀態」分類。
- 欄位：粉絲頁名稱＋編號、偽冒風險程度、廣告風險分布、投放平台、追蹤者數、資料來源、處理狀態、最後爬取時間。
- 點欄位標題可**排序**（預設依風險由高到低）。
- 最左邊 ▶ 可**展開**看底下的關聯廣告；每則廣告旁的 👁 眼睛可看截圖。
- 點粉絲頁名稱或最右邊箭頭，打開**案件詳情抽屜**。
- 下方有分頁（每頁 10／25／50 筆）。

### 3.5 案件詳情抽屜（右側滑出）

由上到下分區：

1. **標籤列**：風險、來源、狀態
2. **粉絲頁資訊**（標題旁 👁 看粉絲頁截圖）：編號、追蹤者、投放平台、累積命中次數、首次／最後爬取時間、是否認證、建立時間、是否正在刊登廣告、最後更名時間、類別、管理者所在地、改名歷程、About、Bio、Email、Phone、粉絲頁連結
3. **關聯廣告**：每則廣告文案、編號、日期、風險，旁邊 👁 看截圖（**廣告不提供外部連結**）
4. **風險判斷**：風險等級、分數、命中的規則與加分
5. **原始偵測紀錄**：每次被偵測到的來源與時間
6. **案件紀錄**：目前狀態、最後爬取、建立時間
7. **底部：處理狀態下拉** → 選新狀態會跳出**確認視窗**，確認後才變更（只改畫面，不會真的送出任何東西）

### 3.6 截圖檢視

點任何 👁 會跳出截圖視窗。目前是**灰色佔位框**，正式版會放爬取當下留存的截圖。

---

## 4. 業務規則與名詞定義

### 4.1 處理狀態（Case Status）

| 程式代碼 | 中文 | 定義 | Badge 顏色 |
| --- | --- | --- | --- |
| `scheduled`（預設） | 已排程 | 已建立 case，待內部處理 | 藍（處理中） |
| `submitted` | 已送件 | 已人工送出 Meta 檢舉 | 藍（處理中） |
| `accepted` | 已受理 | Meta 已受理或回覆 | 藍（處理中） |
| `success` | 已下架成功 | 經送件後成功下架 | 綠（已下架） |
| `takedown_confirmed` | 因其他因素被下架 | target 已消失，但不一定由我們送件造成 | 綠（已下架） |
| `failed` | 下架失敗 | Meta 拒絕或無法處理 | 紅 |
| `not_submitted` | 不送件 | 證據不足、資料不足或其他原因 | 灰（結案不處理） |
| `false_positive` | 誤判 | 判斷非偽冒 | 灰（結案不處理） |

表格依「處理狀態」排序時，照上表由上到下的順序。

### 4.2 資料來源

- **Fan Page**：從粉絲頁搜尋偵測到。
- **Meta Ads**：從 Meta 廣告偵測到。
- **雙來源命中**：兩者都有。

### 4.3 偽冒風險分數（Rule-based，Epic 2）

風險分數**只看粉絲頁本身**，關聯廣告不計分。Prototype 假資料中用到的規則：

| 規則 | 分數 |
| --- | --- |
| Page ID 命中 Blacklist | 直接 100 分 |
| 包含完整品牌名稱 | +40 |
| 名稱相似度 85–99% | +30 |
| 名稱相似度 70–84% | +15 |
| 含可疑詞（如「商城」「福利」「購票」） | 每個 +10 |
| 從非品牌名稱改為品牌相關名稱 | +30 |
| 曾改名 1 次 | +15 |
| 曾改名 2 次以上 | +20 |

- 假資料中：High = 70 分以上、Medium = 30～50 分、Low = 15 分。
  **程式沒有自動計算分數或等級**，分數、等級、理由都是直接寫在假資料裡的；正式門檻請以 Rule-based spec 為準。
- 粉絲頁屬性（認證、建立時間、類別、管理者所在地、About/Bio、聯絡方式、是否刊登廣告）**僅供人工判讀，不計分**；改名歷程例外（沿用 Name Changed 規則）。
- 偵測用的關鍵字**刻意不在前端顯示**，避免被反向利用。

### 4.4 名詞

- **最後爬取時間**：最後一次爬取到此案件的時間（舊版叫「最後偵測」）。
- **首次爬取時間**：第一次爬到、建立 Watchmen Case 的時間。
- **累積命中次數**：這個粉絲頁總共被爬到幾次。

---

## 5. Prototype 的邊界（哪些是假的）

- 所有資料都是假資料（12 筆案件），客戶固定為「晴光」。
- 風險分數只用於展示，不代表正式規則的計算結果。
- 狀態變更只存在瀏覽器記憶體，**重新整理後還原**。
- 日期範圍**不參與篩選**，只用於 CSV 檔名。
- 粉絲頁連結是假網址；廣告**一律不對外開連結**（原始連結只保留在 Internal Console）。
- 截圖是佔位框。
- 左側選單、使用者、客戶切換、登出、語言切換都沒有功能。
- 部分案件的關聯廣告數比實際列出的多，會顯示「另有 N 則廣告未於 Prototype 展開」，是刻意的。

---

## 6. 給 AI Agent：專案結構與修改指南

> 這一節是寫給接手的 AI Agent（或工程師）看的。主管可以略過。

### 6.1 技術概況

- 純靜態：HTML + CSS + 原生 JavaScript（無框架、無 build、無 npm、無外部 CDN）。
- 直接雙擊 `index.html` 即可執行（`file://` 可用）；也可用 `python3 -m http.server 8080` 開在 `http://localhost:8080`。
- 瀏覽器載入順序：`styles.css` → `mock-data.js`（定義全域 `cases`）→ `app.js`（讀 `cases` 並渲染）。

### 6.2 檔案地圖

| 檔案 | 行數 | 負責什麼 | 什麼時候改它 |
| --- | --- | --- | --- |
| `index.html` | ~330 | 頁面骨架：側欄、上方列、摘要卡、工具列（所有下拉的 `<option>`）、表頭、抽屜外框、確認 Modal、截圖 Modal | 改靜態文字、表頭欄位、下拉選項、版面區塊 |
| `mock-data.js` | ~400 | 唯一資料來源：`const cases = [...]` 12 筆案件 | 加／改／刪假資料、加新資料欄位 |
| `app.js` | ~980 | 所有互動與動態渲染：篩選、搜尋、排序、分頁、表格列、抽屜內容、狀態變更、截圖 Modal、CSV 匯出 | 改表格列內容、抽屜內容、篩選邏輯、狀態定義、匯出欄位 |
| `styles.css` | ~1750 | 全部樣式；頂端 `:root` 有顏色、字級、間距變數 | 改顏色、字級、間距、RWD |
| `README.md` | — | 本文件 | 功能或規則改動後同步更新 |

### 6.3 資料模型（`mock-data.js` 每筆 case 的欄位）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `id` | string | Case ID，如 `WM-202607-001` |
| `name` | string | 粉絲頁名稱 |
| `pageId` | string | 粉絲頁編號（也是粉絲頁截圖的查找 key） |
| `pageUrl` | string | 粉絲頁連結（假） |
| `followers` | number | 追蹤者數 |
| `platforms` | string[] | `facebook` / `instagram` / `messenger` / `threads` / `audience_network` |
| `sources` | string[] | `fan-page` / `meta-ads`；兩個都有 = 雙來源命中 |
| `ads` | number | 關聯廣告**總數**（可大於 `adsData.length`） |
| `adsBreakdown` | `{high, medium, low}` | 廣告風險分布（表格「廣告風險」欄） |
| `adsData` | array | 實際列出的廣告：`{ id, title, detectedAt: 'YYYY/MM/DD', risk }` |
| `firstDetected` / `lastDetected` | string | `'YYYY/MM/DD HH:mm'` 格式（程式會 parse，格式不能變） |
| `risk` | `'high' \| 'medium' \| 'low'` | 偽冒風險等級 |
| `riskScore` | number | 分數（純顯示） |
| `reasons` | string[] | 命中規則文字，如 `'包含完整品牌名稱 +40'` |
| `status` | string | 必須是 `STATUS_DEFS` 裡的 key |
| `seenCount` | number | 累積命中次數（也決定原始偵測紀錄中 Fan Page 筆數） |
| `verified` | boolean | 是否認證 |
| `pageCreatedAt` | string | 粉絲頁建立日期 |
| `categories` | string[] | 類別 |
| `adminLocations` | string[] | 管理者所在地 |
| `nameHistory` | array | `{ from, to, changedAt }`，空陣列 = 未曾改名 |
| `about` / `bio` / `email` / `phone` | string | 粉絲頁資料 |
| `runningAds` | boolean | 是否正在刊登廣告 |

**「原始偵測紀錄」不是資料欄位**，是 `app.js` 的 `buildDetectionHistory()` 依 `seenCount`、首次／最後爬取時間、`adsData` 自動推算出來的，維持單一資料來源。

### 6.4 `app.js` 結構導覽

| 區塊 / 函式 | 作用 |
| --- | --- |
| `buildDetectionHistory()` | 推算原始偵測紀錄 |
| `state` | 目前的篩選、搜尋、分頁、排序、展開狀態（預設排序 `risk desc`） |
| `ui` | 所有 DOM 元素參照（以 `index.html` 的 `id` 查找） |
| `STATUS_DEFS` | **處理狀態的唯一定義**：label、tone（配色）、order（排序）、hint（說明） |
| `labelMap` | 風險、來源、平台的顯示文字 |
| `riskTag` / `statusBadge` / `sourceBadges` / `platformIcons` / `adRiskCell` 等 | 產生小元件 HTML |
| `sortAccessors` | 每個可排序欄位的排序依據（key 對應表頭 `data-sort`） |
| `splitKeywords` / `matchKeyword` | 多關鍵字搜尋 |
| `getActiveCases()` | 套用所有篩選＋排序，回傳目前結果（表格、摘要卡、CSV 都用它） |
| `renderTable()` | 渲染表格列、展開的廣告子列、分頁、摘要卡數字 |
| `getActiveFilterChips` / `renderActiveFilters` / `clearFilter` | 已套用條件 chips |
| `openDrawer()` | 產生整個案件詳情抽屜的 HTML（各 `drawer-section` 區塊） |
| `openStatusModal` / `confirmStatusChange` | 狀態變更確認流程 |
| `openShot()` | 截圖 Modal（`kind` = `page` 或 `ad`） |
| `exportCsv()` | CSV 匯出（`headers` 陣列與 `base` 陣列一一對應） |
| 檔案最後的「事件」區 | 所有 `addEventListener` 綁定 |

### 6.5 常見修改食譜（Where to change what）

**改一段靜態文字** → 先在 `index.html` 搜尋；找不到就在 `app.js` 搜尋（動態產生的文字在 `renderTable` / `openDrawer` / `showToast` 呼叫中）。

**新增一筆假案件** → 在 `mock-data.js` 的 `cases` 陣列複製一筆既有物件修改。必須填齊 6.3 所有欄位，日期格式保持一致，`status` 要是合法 key。

**新增一個資料欄位並顯示** →
1. `mock-data.js`：**每一筆**案件都加上該欄位。
2. 要在抽屜顯示：`app.js` 的 `openDrawer()` 裡照既有 `detail-item` 格式加一段。
3. 要在主表格顯示：`index.html` 表頭加 `<th>`（要排序就加 `data-sort="xxx"` 的按鈕），`app.js` 的 `renderTable()` 對應位置加 `<td>`；要排序再到 `sortAccessors` 加同名 key。**記得把展開子列的 `colspan="10"` 改成新欄數。**
4. 要匯出：`exportCsv()` 的 `headers` 和 `base` **同一位置**各加一項。

**新增／修改處理狀態**（要改 3 處，缺一不可）→
1. `app.js` 的 `STATUS_DEFS`（label、tone、order、hint）。
2. `index.html` 的 `#statusFilter` 下拉 `<option>`。
3. `index.html` 的 `#statusSelect`（抽屜底部）下拉 `<option>`。
（tone 可用：`progress` 藍、`success` 綠、`danger` 紅、`neutral` 灰，對應 `styles.css` 的 `.badge--*`。）

**新增一個篩選下拉** →
1. `index.html` 的 `.toolbar-filters` 裡照既有 `<select class="filter-select">` 加一個。
2. `app.js`：`state` 加欄位、`ui` 加參照、`getActiveCases()` 加比對條件、事件區加 `change` 監聽（照 `riskFilter` 的寫法）、`getActiveFilterChips()`、`renderActiveFilters()`（下拉高亮清單）與 `clearFilter()`（含「清除全部」與下拉值回填）加對應處理，讓 chips 正常運作。

**改顏色、字級** → `styles.css` 最上方 `:root` 變數（如 `--high`、`--medium`、`--low`、`--navy`、`--fs-*`）。改變數會全站套用，優先改變數而不是個別 class。

**改抽屜區塊順序** → `openDrawer()` 裡每個 `<section class="drawer-section">` 是一個區塊，整段搬動即可。

**讓日期真的參與篩選** → 在 `getActiveCases()` 加入以 `ui.dateFrom.value` / `ui.dateTo.value` 比對 `lastDetected` 的條件，並注意假資料日期（2026/07）與預設日期範圍（2026/08/15–08/21）目前不重疊，需一併調整，否則全部被濾掉。

### 6.6 修改後必做：更新快取版本號

`index.html` 引用資源時帶有版本號（目前是 `?v=13`）：

```html
<link rel="stylesheet" href="styles.css?v=13" />
<script src="mock-data.js?v=13"></script>
<script src="app.js?v=13"></script>
```

改過 CSS / JS 後，把三處的數字一起 +1，避免瀏覽器（尤其是部署到 GitHub Pages 後）讀到舊檔。

### 6.7 Agent 工作守則

- **維持現有視覺與資訊架構**，不引入框架、套件、build 工具或後端。
- **資料只放 `mock-data.js`**，不要在 `app.js` 裡寫死案件資料。
- 動態插入使用者可見文字時，沿用 `escapeHtml()`。
- **廣告不可加入對外連結**（業務規則）；偵測關鍵字不可顯示在前端。
- 功能或規則有變動時，同步更新本 README 的第 3～5 節。
- 改完用瀏覽器打開 `index.html` 實際點過：篩選、搜尋、排序、展開、抽屜、狀態變更、截圖、CSV 匯出，確認 Console 沒有錯誤。
- 回報時列出改了哪些檔案、哪些區塊，以及使用者該去畫面哪裡確認。

---

## 7. 部署到 GitHub Pages

部署完會得到一個網址（例如 `https://你的帳號.github.io/watchmen-v2-prototype/`），任何人用瀏覽器打開就能看，不需要安裝任何東西。

### 7.0 事前準備

- 一個 GitHub 帳號（https://github.com/signup）。
- ⚠️ **公開性**：免費帳號的 GitHub Pages 只能用在 **Public repository**，代表程式碼和網址任何人都看得到。本專案全是假資料，但若介意，請改用公司 GitHub Organization（付費方案可開 private repo + Pages）或改用 Vercel（見下方 7.4）。

### 7.1 放上 GitHub（在 Claude Code / Codex 裡用說的完成）

> 📘 含 GitHub 畫面截圖與生活比喻的圖文版：請看交接手冊《Watchmen 專案交接手冊》Part 1、Part 2。
> 不需要開程式編輯器或終端機，所有 Git 動作都在 Claude Code / Codex 桌機 app 的對話框裡請 AI 完成。AI 要執行指令前會先問你，看懂了再按允許。

**名詞一句話**

| 名詞 | 就像 |
|---|---|
| `git init` | 幫資料夾裝上「存檔系統」，每個專案做一次 |
| `commit` | 按下存檔並寫一句備註，**只存在自己電腦** |
| `push` | 把存檔**上傳到 GitHub**，部署平台看的是 GitHub 上的版本 |
| repo | GitHub 上這個專案專屬的保險箱 |
| 連線（remote / origin） | 資料夾和保險箱之間的水管，push 才知道要送去哪 |

**第一次使用這台電腦（整台電腦只做一次）**：對 AI 說

```text
請幫我檢查這台電腦有沒有安裝 Git 和 GitHub CLI（gh），沒有的話幫我安裝，每一步先用白話說明。
然後用 gh auth login 以瀏覽器方式登入 GitHub（HTTPS），完成後執行 gh auth setup-git，出現一次性驗證碼時告訴我。
最後把 git 的全域使用者名稱設為 Yuri，email 設為（你的 GitHub email）。
```

AI 給你 8 碼驗證碼時 → 打開 https://github.com/login/device 輸入 → 按 **Authorize**。

**這個專案的標準流程（開始部署前先做完）**

| # | 在做什麼 | 你要做 / 對 AI 說 |
|---|---|---|
| 1 | 解壓 zip，放到固定位置 | 例如 `文件/Projects/watchmen-v2-fe-prototype`。不要放「下載」或桌面 |
| 2 | 在 app 開啟這個資料夾 | 開新對話時選擇專案資料夾（working folder） |
| 3 | `git init` 啟動存檔系統 | 「請在這個資料夾執行 git init，預設分支設為 main。」 |
| 4 | 開一個 GitHub repo | **網頁**：github.com 左上選單 **All repositories** → **New repository** → Owner 選自己、Repository name 填 `watchmen-v2-prototype`、visibility 選 **Public**、Add README **Off**、.gitignore **No .gitignore**、license **No license** → **Create repository**。<br>**或請 AI**：「請用 gh 在我的 GitHub 帳號下建立名叫 watchmen-v2-prototype 的 public repository，不要加 README。」 |
| 5 | 連線 | repo 頁面綠色 **Code** → **HTTPS** → 複製網址，對 AI 說「請把這個資料夾連線到（網址），remote 名稱用 origin。」（請 AI 建的 repo 可省略網址） |
| 6 | 第一次 `commit` | 「請確認 .gitignore 有排除 .env 和 node_modules，然後 commit 所有檔案，訊息寫『首次匯入專案』，告訴我存了哪些檔案。」清單出現 `.env` 就先停下來請 AI 移除 |
| 7 | `push` | 「請把 main 分支 push 到 GitHub（origin），並設為預設。」 |
| 8 | 確認 | 瀏覽器打開 repo 網址，看到檔案列表和「首次匯入專案」 |

懶人版（第 3～7 步一次說完）：

```text
這是一個剛解壓的新專案。請幫我依序完成，每一步先用白話告訴我在做什麼：
1. git init，預設分支設為 main
2. 用 gh 在我的 GitHub 帳號下建立名叫「watchmen-v2-prototype」的 public repository（不要加 README）
3. 把資料夾連線到這個 repo（remote 名稱 origin）
4. 確認 .gitignore 有排除 .env 和 node_modules，然後 commit 所有檔案，訊息寫「首次匯入專案」
5. push 到 GitHub，最後給我 repo 的網址
```

**之後每次修改**：請 AI 改 → 「請在本機跑起來給我看」→ 「請 commit（訊息用中文說明改了什麼）並 push 到 GitHub」→ 部署平台幾分鐘內自動更新。只有 commit 沒有 push，網站不會變。

### 7.2 開啟 GitHub Pages

1. 在 GitHub repo 頁面點上方 **Settings** → 左側 **Pages**。
2. **Build and deployment** 區塊：Source 選 **Deploy from a branch**；Branch 選 `main`、資料夾選 `/ (root)` → **Save**。
3. 等 1～3 分鐘，重新整理 Pages 頁面，上方出現 **Your site is live at https://…**，點進去就是 Prototype。

### 7.3 之後要更新畫面

1. 請 AI 修改，並**照 [6.6](#66-修改後必做更新快取版本號) 把版本號 +1**，不然別人會看到舊畫面。
2. 對 AI 說：「請 commit 這次的修改，訊息用中文說明改了什麼，然後 push 到 GitHub。」
3. 約 1～3 分鐘後網址自動更新。可到 repo 的 **Actions** 分頁看進度（綠勾 = 完成）。

### 7.4 替代方案：Vercel（想要 private repo 時）

1. 用 GitHub 帳號登入 https://vercel.com → **Add New… → Project** → 選這個 repo → **Import**。
2. Framework Preset 選 **Other**，其他全部預設 → **Deploy**。
3. 完成後會拿到 `https://xxx.vercel.app` 網址。之後每次 push 到 `main` 會自動重新部署。

### 7.5 常見問題

| 狀況 | 原因 / 解法 |
|---|---|
| 網址打開是 404 | 剛開啟要等幾分鐘；或 `index.html` 不在 repo 最外層（被包在子資料夾裡）。 |
| 改了檔案但畫面沒變 | 瀏覽器快取 → 按 `Cmd+Shift+R`；並確認有做 6.6 版本號 +1。 |
| Settings 裡找不到 Pages 選項 | repo 是 Private 且帳號是免費方案 → 改成 Public 或用 7.4 Vercel。 |
