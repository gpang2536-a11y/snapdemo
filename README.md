# 貪食蛇 Snake Game

## 專案簡介
本專案為單頁版貪食蛇遊戲，使用 HTML、CSS、JavaScript 製作，無需外部依賴。支援鍵盤（方向鍵/WASD）、手機觸控按鈕與滑動操作，並具備分數、最高分、等級、音效、分享分數等功能。

## 執行方式
直接開啟 `index.html` 即可遊玩。

## 操作方式
- 鍵盤：方向鍵或 WASD 控制蛇移動，P 鍵暫停/恢復。
- 觸控：螢幕方向按鈕或在 Canvas 上滑動。
- 重新開始、分享分數、難度選擇等功能皆於畫面按鈕操作。

## 常數調整
可於 `game.js` 檔案開頭調整以下常數：
- `CELL_SIZE`：格子大小
- `COLS`、`ROWS`：網格尺寸
- `SPEEDS`：各難度速度
- `SPEED_UP_EVERY`、`SPEED_UP_AMOUNT`：加速條件與幅度

## 主要檔案
- `index.html`：主頁面，載入 CSS/JS，含所有 UI 元素
- `style.css`：主題色、響應式設計、觸控按鈕
- `game.js`：遊戲邏輯、分數、音效、觸控、分享

---

## 建議 Commit 訊息
```
feat: 完整貪食蛇遊戲 (HTML/CSS/JS, 響應式, 觸控, 難度, 分數, 音效)
```
