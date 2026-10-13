# 網站內容怎麼改

網站上的成員、研究、論文、活動照片，都寫在這個資料夾的五個檔案裡。改檔案、存檔，網頁就會跟著變，不用碰任何程式。

| 想改的頁面 | 改這個檔案 |
|---|---|
| Members（現在的成員） | `members.json` |
| Members（畢業生） | `alumni.json` |
| Research | `research.json` |
| Publication | `publications.json` |
| Events & Gallery | `gallery.json` |

**這個網站是公開的。** 照片、email、現職等資訊，請先確認本人同意公開再放。

## 怎麼改（不用安裝任何東西）

1. 用實驗室帳號登入 GitHub，打開 https://github.com/nckugese/nckugese.github.io
2. 點進 `data` 資料夾，再點要改的檔案。
3. 按右上角的鉛筆圖示，直接在網頁上修改。
4. 按綠色的 **Commit changes**，再按一次確認。
5. 等一到兩分鐘，重新整理網站就會看到。

要放照片：進到對應的資料夾（成員照片是 `assets/people`，活動照片是 `assets/gallery`），按 **Add file → Upload files**，把照片拖進去，再按 **Commit changes**。

## 三條規則

檔案的格式只要記三件事：

1. 文字要用英文的雙引號包起來：`"像這樣"`。不能用中文引號 `「」` 或 `“”`。
2. 每一項之間用英文逗號 `,` 分開。
3. `{` 和 `}`、`[` 和 `]` 要成對。

最保險的做法是**複製一段現成的，貼上，再改裡面的字**，不要自己從頭打。

寫錯了也不用擔心：那一頁會顯示是哪個檔案的第幾行有問題，改回來就好；GitHub 也保留每一次修改，可以還原。

## 最常做的事

### 新增成員

打開 `members.json`，在 `"people": [` 下面找到同年級的人，把下面這段貼在他們旁邊，改內容：

```json
    {
      "id": "wang-xiao-ming",
      "group": "m1",
      "name": "Xiao-Ming Wang",
      "name_zh": "王小明",
      "photo": "assets/people/wang-xiao-ming.jpg",
      "email": ""
    },
```

- `id`：這個人的代號，只能用小寫英文、數字和 `-`，不能和別人重複。
- `group`：年級，填下面其中一個。

| 填這個 | 意思 |
|---|---|
| `professor` | 教授 |
| `postdoc` | 博士後 |
| `phd` | 博士班 |
| `m2` | 碩二 |
| `m1` | 碩一 |
| `undergrad` | 大學部專題生 |
| `staff` | 人員 |

- 不想填的欄位（例如 `email`），整行刪掉或留空 `""` 都可以。
- 沒有照片就把 `photo` 那一行刪掉，頁面會顯示姓名縮寫。

### 升年級

找到那個人，把 `"group": "m1"` 改成 `"group": "m2"`。

### 畢業

1. 在 `members.json` 把那個人的整段 `{ ... },` 剪下。
2. 貼到 `alumni.json` 的 `"people": [` 下面。
3. 把 `"group": ...` 那一行換成學位和畢業年份：

```json
    { "id": "wang-xiao-ming", "name": "Xiao-Ming Wang", "name_zh": "王小明", "degree": "M.S.", "year": 2027, "photo": "assets/people/wang-xiao-ming.jpg" },
```

頁面會自動依年份分組，新的在上面。

### 換照片或加照片

1. 把照片存成正方形，檔名用英文和數字（例：`wang-xiao-ming.jpg`）。
2. 上傳到 `assets/people`。
3. 在那個人的資料裡寫 `"photo": "assets/people/wang-xiao-ming.jpg"`。

建議邊長 400 到 600 像素、200 KB 以內。頁面會自動裁成圓形。

### 幫成員加個人介紹

在那個人的資料裡加上需要的欄位，點他的照片就會看到：

```json
      "bio": ["第一段介紹。", "第二段介紹。"],
      "interests": ["研究興趣一", "研究興趣二"],
      "education": ["M.S., Chemical Engineering, NCKU, 2025"],
      "experience": ["經歷一"],
      "links": { "Google Scholar": "https://..." }
```

### 新增論文

打開 `publications.json`，在 `"publications": [` 下面，把這一行貼在同年份的最上面，改內容：

```json
    {"year": 2027, "title": "論文標題", "authors": "A Student, W Wu", "venue": "期刊名 卷, 頁碼", "link": "https://doi.org/...", "kind": "journal", "field": "process", "corresponding": true},
```

- `link`：填了，右邊才會出現跳到期刊的按鈕。
- `corresponding`：吳老師是通訊作者填 `true`，不是填 `false`（填 `false` 的不會顯示）。
- `field`：領域，填下面其中一個。

| 填這個 | 領域 |
|---|---|
| `hydrogen` | Hydrogen & Fuel Cells |
| `carbon` | Carbon Capture & Low-Carbon Industry |
| `biomass` | Biomass, Microalgae & Waste Conversion |
| `renewable` | Renewable Energy & Biofuel Systems |
| `process` | Process Design, Intensification & Control |
| `lca` | Life Cycle & Environmental Assessment |
| `ai` | AI & Data-Driven Modeling |

### 新增活動和照片

每一則活動就是標題、說明，加上一張或多張照片；多張照片在頁面上可以左右滑。

1. 在 `assets/gallery` 裡開一個新資料夾（例：`2026-year-end`），把照片上傳進去。檔名用英文和數字，不要有空白。
2. 打開 `gallery.json`，在 `"events": [` 下面把這段貼在最上面，改內容：

```json
    {
      "title": "Year-end party",
      "date": "2026.12",
      "text": "活動說明，不寫就留空。",
      "photos": [
        "2026-year-end/01.jpg",
        "2026-year-end/02.jpg",
        "2026-year-end/03.jpg"
      ]
    },
```

- 第一張照片是封面。
- 活動照你寫的順序顯示，新的放最上面。
- 想幫某張照片加說明，把那一行寫成 `{ "file": "2026-year-end/02.jpg", "caption": "說明文字" }`。
- 照片建議長邊 1600 像素以內、每張 400 KB 以內。
- **手機拍的照片常帶有拍攝地點**，上傳前請先移除（用通訊軟體傳過一次的照片通常已經移除）。

### 新增研究計畫

打開 `research.json`，在 `"projects": [` 下面貼上：

```json
    { "year": 2027, "period": "2027–2029", "title": "英文計畫名稱", "title_zh": "中文計畫名稱", "grant": "計畫編號" },
```

頁面會自動把新的排在前面。

## 全部欄位一覽

上面沒提到的欄位，需要時再查。

### members.json 和 alumni.json 的每個人

| 欄位 | 必填 | 說明 |
|---|---|---|
| `id` | 是 | 代號，小寫英文、數字和 `-`，不能重複 |
| `group` | 是 | 年級代號（只有 `members.json` 需要） |
| `name` | 是 | 英文姓名 |
| `name_zh` | | 中文姓名 |
| `title` | | 身分，不填就用年級的預設值 |
| `photo` | | 照片路徑 |
| `email` | | 電子信箱，頁面上點一下可以複製 |
| `links` | | 其他連結，寫成 `"顯示文字": "網址"` |
| `bio` | | 自我介紹，每一項是一段 |
| `interests` | | 研究興趣 |
| `experience` | | 經歷 |
| `education` | | 學歷 |
| `office` | | 辦公室或座位 |
| `phone` | | 電話 |
| `degree` | | 學位，例：`"M.S."`、`"Ph.D."`（畢業生） |
| `year` | | 畢業年份，直接寫數字（畢業生） |
| `thesis` | | 論文題目（畢業生） |
| `now` | | 現職（畢業生） |

`members.json` 最上面的 `groups` 是年級的順序和標題：`id` 是代號，`title` 是頁面上的標題，`role` 是這一級的人預設顯示的身分。

### research.json

| 欄位 | 說明 |
|---|---|
| `intro` | 頁面開頭的介紹，每一項是一段 |
| `areas` | 研究方向，每一項有 `id`、`title`（標題）、`text`（說明）。`id` 和論文的領域代號相同，首頁的按鈕也用它，不要改 |
| `tools_title` | 工具區塊的標題 |
| `tools` | 使用的軟體和方法，照寫的順序顯示 |
| `projects_title` | 主持計畫區塊的標題 |
| `projects_fold_before` | 起始年早於這個年份的計畫會收起來，點了才展開。填 `0` 就全部顯示 |
| `projects` | 吳老師主持的計畫：`year`（起始年）、`period`（顯示的期間）、`title`、`title_zh`、`grant`（計畫編號，不顯示） |
| `team_projects_title` | 參與計畫區塊的標題 |
| `team_projects` | 其他老師主持、吳老師參與的計畫，欄位同上 |

### publications.json

檔案裡放的是全部論文，頁面上顯示哪些由最上面兩個設定決定：

| 設定 | 說明 |
|---|---|
| `show_only_corresponding` | `true` 只顯示吳老師是通訊作者的論文；`false` 全部顯示 |
| `show_kinds` | 要顯示的類型。`["journal"]` 只顯示期刊論文，可以再加 `"conference"`、`"chapter"` |

`fields` 是領域的順序和標題。

每篇論文：

| 欄位 | 必填 | 說明 |
|---|---|---|
| `title` | 是 | 論文標題 |
| `year` | | 發表年份，直接寫數字 |
| `authors` | | 作者 |
| `venue` | | 期刊、卷期、頁碼 |
| `link` | | 論文網址，建議用 DOI 連結 |
| `kind` | | 類型：`journal`、`conference`、`chapter` |
| `field` | | 領域代號 |
| `corresponding` | | 吳老師是否為通訊作者：`true` 或 `false` |
| `corresponding_checked` | | `true` 表示已經對過出版社頁面；沒有這一欄的是依作者排序推測的 |

### gallery.json

| 欄位 | 必填 | 說明 |
|---|---|---|
| `title` | 是 | 活動名稱 |
| `date` | | 日期，照你寫的原樣顯示 |
| `text` | | 活動說明 |
| `photos` | 是 | 照片清單，路徑從 `assets/gallery/` 之後開始寫 |

## 出錯的時候

頁面如果顯示「could not be shown」，下面會寫是哪個檔案的第幾行。到那一行和它的上一行，檢查：

- 上一行的結尾是不是少了逗號。
- 引號是不是英文的 `"`，有沒有少一個。
- 括號有沒有成對。

找不到的話，把整個檔案的內容貼到 https://jsonlint.com ，它會標出錯的位置。真的改不回來，在 GitHub 上那個檔案的 **History** 可以看到每一次修改，回到上一版即可。
