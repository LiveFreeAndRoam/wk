# 🏮 WaniKani Example Sentence Fetcher

A **React + Grommet** web application that uses the **WaniKani API** to fetch all example sentences from vocabulary lessons in one or more specified levels. Sentences are grouped by level and can be exported as text or JSON files.

---

## ✨ Features

* Fetch example sentences from **multiple WaniKani levels**.
* Accepts flexible level input formats:

  * Single: `12`
  * Comma-separated: `3,5,8`
  * Ranges: `4-9`
  * Mixed: `4,5-7,9-12,15`
* Groups sentences by level.
* Export options:

  * **Japanese sentences only** (`.txt` per level)
  * **English sentences only** (`.txt` per level)
  * **Full sentences** (Japanese + English) (`.txt` per level)
  * **All data as JSON** (`wanikani_sentences.json`)
* Automatically saves and restores your **WaniKani API token** using `localStorage`.
* Clean, responsive UI powered by **Grommet**.
* Handles browser throttling on export by queuing file downloads.

---

## 🧩 Requirements

* **Node.js** ≥ 18
* **npm** or **yarn**

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/wanikani-sentence-fetcher.git
cd wanikani-sentence-fetcher
```

### 2️⃣ Install Dependencies

```bash
npm install
# or
yarn install
```

### 3️⃣ Run the App

```bash
npm start
# or
yarn start
```

The app will open automatically at `http://localhost:3000/`.

---

## 🔑 API Token Setup

1. Log into your WaniKani account.
2. Go to **Settings → API Tokens**.
3. Create a **v2 API token**.
4. Copy the token and paste it into the app’s **API Token** field.

The token will be securely saved in `localStorage` and reused next time you open the app.

---

## 💾 Export Behavior

When exporting results for multiple levels (e.g., `3,5,7-9`):

* Each level’s sentences are saved in **separate files**.
* The app automatically adds a small delay between downloads to prevent browser throttling.

File naming examples:

```
wanikani_level_3_japanese.txt
wanikani_level_3_english.txt
wanikani_level_3_sentences.txt
wanikani_sentences.json
```

---

## 🧠 Tech Stack

* **React 18+**
* **Grommet UI Library** – [https://v2.grommet.io](https://v2.grommet.io)
* **WaniKani API v2** – [https://docs.api.wanikani.com/20170710](https://docs.api.wanikani.com/20170710)

---

## ⚙️ Implementation Notes

* The fetcher respects WaniKani’s rate limits (60 requests/minute).
* Parsing of level input uses a custom `parseLevels()` utility.
* File export is handled with timed `Blob` downloads to ensure reliability.
* Token persistence implemented via `localStorage`.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 💬 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.

---

### 🧭 Future Improvements

* [ ] Parallelized fetching with rate-limit handling.
* [ ] Search and filter sentences by keyword.
* [ ] Option to export in CSV format.
* [ ] Persistent sentence cache.
