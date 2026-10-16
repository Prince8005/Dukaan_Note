# DukaanNote

A lightweight, AI-assisted digital transaction ledger designed for Indian shopkeepers and small merchants. DukaanNote transforms informal, free-form transaction notes written in English or Hinglish into structured, reviewable entries before committing them to a digital ledger.

---

## 📌 Problem Statement

Small Indian shopkeepers often record daily sales, credit, and purchases in informal handwritten notes, WhatsApp messages, or memory (e.g., *"Ramesh ko 2 kilo chawal 120 rupaye mein diya"* or *"Bought 5 kg atta for ₹250"*). 

Managing traditional *khata* notebooks manually leads to:
- Time-consuming reconciliation at the end of the day.
- Calculation and transcription errors.
- Disorganized transaction history.

---

## 💡 Solution

**DukaanNote** provides a "Human-in-the-Loop" bookkeeping flow:
1. **Raw Note Entry:** The merchant writes or pastes natural notes in everyday language.
2. **AI-Powered Extraction:** A backend service queries Google's **Gemma** model to extract structured data: Item, Quantity, Amount (₹), and Transaction Type (*Sale* or *Purchase*).
3. **Editable Draft Table:** The extracted entries are presented as editable drafts. The shopkeeper reviews and modifies values rather than blindly trusting automated entries.
4. **Confirmed Digital Ledger:** Once validated, records are committed to the local ledger, updating daily sales and purchase totals in real time.

---

## 🤖 AI & Technology Stack

* **Frontend:** React 19, Vite, Vanilla CSS
* **Backend:** Node.js, Express, CORS, Dotenv
* **AI Model:** **`gemma-4-31b-it`** (via Google Gen AI SDK)
* **Storage:** Browser `localStorage` (client-side persistence for the prototype)

### Architecture & Security Flow

```

[React Frontend] (Port 5173)
│
▼ (POST /api/parse-note)
[Node.js / Express Backend] (Port 5000)
│
▼ (Google Gen AI SDK with private API key)
[Google Gemma: gemma-4-31b-it]
│
▼ (Structured JSON Array)
[Draft Table in UI] ──(Review & Confirm)──► [Local Digital Ledger]

```

> **Security Note:** The Google API key is stored strictly on the backend via environment variables (`.env`) and is never exposed to client-side code or committed to version control.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- A Google AI Studio API Key with access to Gemma models

### 1. Clone the Repository
```bash
git clone [https://github.com/Prince8005/Dukaan_Note.git](https://github.com/Prince8005/Dukaan_Note.git)
cd Dukaan_Note

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=5000

```

### 4. Start the Backend Server

In your first terminal:

```bash
node server.js

```

The server will run at `http://localhost:5000`.

### 5. Start the Frontend

In a second terminal:

```bash
npm run dev

```

Open `http://localhost:5173` in your browser.

---

## 🧪 Current Features

* [x] Natural language note parsing (English & Hinglish) via **Gemma 4 (31B IT)**.
* [x] Structured draft table with editable item names, quantities, amounts, and transaction types.
* [x] Input validation ensuring non-negative values and correct types before committing.
* [x] Persistent storage of confirmed entries using browser `localStorage`.
* [x] Live calculation of total sales and total purchases.
* [x] Discard and row-removal options for draft entries.

---

## ⚠️ Known Limitations & Future Roadmap

* **API Latency:** As a large 31B parameter model running on the API, parsing takes a few seconds per note depending on network and server traffic.
* **Database Persistence:** Currently relies on browser `localStorage`. Future updates will connect to MongoDB for multi-device sync and shopkeeper authentication.
* **Offline Mode:** Requires internet connectivity to reach the backend parsing service.
* **Export Options:** CSV/PDF export of daily hisaab is planned for future milestones.

---

## 👥 Team: ByteBuilders

Developed for **Hacktoberfest Hack Day: Lucknow × Integral University Lucknow**.
---