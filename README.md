# Watchmen V2 — Multi-source Detection FE Prototype

這是一份不含後端的靜態前端 Prototype，延續現有 `st.console` 視覺，新增：

- FB Fan Page / Meta Ads / 雙來源命中篩選
- 以粉專為主體的 Case List
- Source badges、關聯廣告數、風險原因與處理狀態
- 案件詳情 Drawer
- 「1 個粉專 + N 則廣告」加入 Internal Console 檢舉排程的確認 Modal
- CSV 匯出、搜尋與互動假資料
- 「案件視圖」與「原始偵測結果」切換（預設停留案件視圖）
- 原始偵測結果可分別查看 Qsearch FB 粉專命中紀錄、Meta Ads 命中紀錄，並可點回對應案件詳情
- 假資料統一放在 `mock-data.js`，原始偵測紀錄由 `app.js` 依案件資料反推，維持單一資料來源

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
- 「加入檢舉排程」只改變前端記憶體狀態，重新整理後會還原。
- FB / Meta URL 為展示用假連結。
