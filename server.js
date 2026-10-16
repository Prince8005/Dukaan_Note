import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Gemma 2 model per partner challenge guidelines
const MODEL_NAME = 'gemma-4-31b-it';
// const MODEL_NAME = 'gemma-4-26b-a4b-it';


app.post('/api/parse-note', async (req, res) => {
  const { note } = req.body;

  if (!note || typeof note !== 'string' || !note.trim()) {
    return res.status(400).json({ error: 'Please provide a valid note.' });
  }

  const prompt = `
You are a transaction parser for an Indian shopkeeper's notebook (khata).
Extract transactions from the user's note (written in English, Hindi, or Hinglish).

Rules:
1. Return ONLY a valid JSON array of objects. Do not include markdown codeblocks or explanation.
2. Each object must have these exact fields:
   - "item": string (name of item or customer/supplier name if item is not specified)
   - "quantity": number (default to 1 if not stated)
   - "amount": number (price or money exchanged, default to 0 if missing)
   - "type": "Sale" or "Purchase"

Input Note: "${note}"
`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const rawText = response.text?.trim() || '[]';
    // Clean any accidental markdown fencing like ```json ... ```
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    res.json({ transactions: parsedData, model: MODEL_NAME });
  } catch (err) {
    console.error('AI parsing error:', err);
    res.status(500).json({ 
      error: 'Failed to interpret note with Gemma model. Check your API key or try a clearer note.' 
    });
  }
});

app.listen(port, () => {
  console.log(`DukaanNote backend running on http://localhost:${port}`);
});