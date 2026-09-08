# Watchmen V2 — Multi-source Detection FE Prototype

這是一份不含後端的靜態前端 Prototype，延續現有 `st.console` 視覺，新增：

- FB Fan Page / Meta Ads / 雙來源命中篩選
- 以粉絲頁為主體的單一 Case List（不再拆出「可忽略清單」，一律用 Case Status 分類）
- Source badges、關聯廣告數、偽冒風險程度與廣告風險兩種分數、處理狀態
- 案件詳情 Drawer：粉絲頁資訊（含截圖眼睛）→ 關聯廣告清單（每則小眼睛）→ 風險判斷 → 原始偵測紀錄 → 案件紀錄
- 廣告不提供對外連結（Meta Ads Library），前端只用眼睛開啟截圖檢視；原始連結僅保留於 Internal Console
- Drawer 底部以狀態下拉切換 Case Status，變更前有確認 Modal
- 查詢條件整併為表格上方單一工具列：搜尋框 + 日期下拉 + 四個維度下拉 + 匯出（原本獨立的上方篩選區已移除）
- 搜尋支援多關鍵字（空白／逗號／頓號分隔，任一命中即顯示），比對粉絲頁名稱、粉絲頁編號、Case ID、廣告編號與廣告文案
- 已套用的條件以 chips 呈現（可個別移除、一鍵清除全部）；沒套用時整列不佔空間，下拉本身也會高亮標示
- 日期範圍收成一個下拉，點開才展開「自／到」與快速捷徑
- CSV 匯出、搜尋與互動假資料
- 假資料統一放在 `mock-data.js`，原始偵測紀錄由 `app.js` 依案件資料反推，維持單一資料來源

## Case Status 定義

| Status | 中文 | 定義 |
| --- | --- | --- |
| `scheduled`（預設） | 已排程 | 已建立 case，待內部處理 |
| `not_submitted` | 不送件 | 證據不足、資料不足或其他原因 |
| `false_positive` | 誤判 | 判斷非偽冒 |
| `submitted` | 已送件 | 已人工送出 Meta 檢舉 |
| `accepted` | 已受理 | Meta 已受理或回覆 |
| `takedown_confirmed` | 因其他因素被下架 | target 已消失，但不一定由我們送件造成 |
| `success` | 已下架成功 | 經送件後成功下架 |
| `failed` | 下架失敗 | Meta 拒絕或無法處理 |

Badge 配色：處理中（scheduled / submitted / accepted）藍、已下架（success / takedown_confirmed）綠、`failed` 紅、結案不處理（not_submitted / false_positive）灰。

## 名詞定義

- **最後爬取時間**：最後一次爬取到此案件的時間（原本的「最後偵測」）。

## 本機預覽

此專案沒有 npm 依賴，可直接開啟 `index.html`。建議用簡單 HTTP server：

```bash
python3 -m http.server 8080
```

開啟：

```text
http://localhost:8080
```

## 部署到 GitHub Pages

1. 建立 GitHub repository。
2. 將 `index.html`、`styles.css`、`mock-data.js`、`app.js` 推到 `main` branch 根目錄。
3. Repository → **Settings** → **Pages**。
4. Source 選擇 **Deploy from a branch**。
5. Branch 選擇 `main`，Folder 選擇 `/ (root)`。
6. 儲存後等待 GitHub Pages 產生網址。

也可使用 GitHub CLI：

```bash
git init
git add .
git commit -m "feat: add Watchmen V2 FE prototype"
git branch -M main
gh repo create watchmen-v2-prototype --public --source=. --remote=origin --push
```

接著在 GitHub Pages 設定中啟用 `main / root`。

## 給 Claude Code 的後續修改方向

```text
請維持目前 Watchmen V2 靜態網站的視覺與資訊架構，不加入後端。
```

## Prototype 邊界

- 所有資料均為假資料。
- 風險分數只用於展示，不代表正式 rule-based spec。
- 狀態變更只改變前端記憶體狀態，重新整理後會還原。
- 日期範圍目前不參與篩選（僅用於 CSV 檔名），維持原 prototype 行為。
- 粉絲頁 URL 為展示用假連結；廣告一律不對外開連結。
- 截圖以 placeholder 呈現，實作時再接爬取當下留存的截圖。
