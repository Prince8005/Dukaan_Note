# DukaanNote

DukaanNote is an AI-assisted transaction-note-to-ledger tool concept for small Indian shopkeepers.

## Problem

Informal shop records can be difficult to organize and maintain digitally, especially when transactions are noted in everyday language.

## Proposed solution

Shopkeepers can enter transaction notes in English or Hinglish. A local backend uses Gemma 2 to extract structured transaction details into a draft that users can review before saving.

## Current features

- Responsive React dashboard
- Example-note suggestions in English and Hinglish
- Gemma 2 transaction parsing through the local backend
- Editable and removable draft entries
- Validation before confirmation
- Sales and purchase totals calculated from confirmed entries
- Local browser storage for confirmed transactions

## Tech stack

React, Vite, JavaScript, CSS, and localStorage.

## Current limitations

- Transaction parsing requires the local backend and a configured Gemini API key.
- Data is stored only in the current browser and is not synchronized or backed up.

## Planned improvements

- Improve parsing and error handling.

## Run locally

Install the project dependencies, then start the Vite development server:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

In a separate terminal, configure `GEMINI_API_KEY` in the environment and start the parsing backend:

```bash
node server.js
```
