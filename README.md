# DukaanNote

DukaanNote is an AI-assisted transaction-note-to-ledger tool concept for small Indian shopkeepers.

## Problem

Informal shop records can be difficult to organize and maintain digitally, especially when transactions are noted in everyday language.

## Proposed solution

Shopkeepers can enter transaction notes in English or Hinglish. The planned Gemma integration will extract structured transaction details into a draft that users can review before saving.

## Current features

- Responsive React dashboard
- Example-note suggestions in English and Hinglish
- Mock draft transaction generation using sample entries
- Editable and removable draft entries
- Validation before confirmation
- Sales and purchase totals calculated from confirmed entries
- Local browser storage for confirmed transactions

## Tech stack

React, Vite, JavaScript, CSS, and localStorage.

## Current limitations

- Transaction parsing uses fixed mock data; notes are not interpreted.
- Gemma/Gemini API integration is not implemented.
- Data is stored only in the current browser and is not synchronized or backed up.

## Planned improvements

- Integrate Gemma through the Gemini API.
- Parse transaction notes into structured drafts.
- Improve error handling.

## Run locally

Install the project dependencies, then start the Vite development server:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.
