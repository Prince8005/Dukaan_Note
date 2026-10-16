import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function checkModels() {
  try {
    const list = await ai.models.list();
    console.log('Available models:');
    for await (const m of list) {
      if (m.name.includes('gemma') || m.name.includes('flash')) {
        console.log(m.name);
      }
    }
  } catch (err) {
    console.error('List error:', err.message);
  }
}

checkModels();

// gemma-4-31b-it
// gemma-4-26b-a4b-it