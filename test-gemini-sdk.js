import { GoogleGenAI } from '@google/genai';

const key = 'AIzaSyAj1EsyiYbWqi1HTlFDuSEQnA1vOKlcSt4';

async function test() {
  const ai = new GoogleGenAI({ apiKey: key });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'hi'
    });
    console.log(response.text);
  } catch (err) {
    console.error(err);
  }
}

test();
