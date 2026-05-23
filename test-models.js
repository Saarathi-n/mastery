import { GoogleGenAI } from '@google/genai';

const key = 'AIzaSyAj1EsyiYbWqi1HTlFDuSEQnA1vOKlcSt4';

async function test() {
  const ai = new GoogleGenAI({ apiKey: key });
  try {
    const response = await ai.models.list();
    for await (const model of response) {
      console.log(model.name);
    }
  } catch (err) {
    console.error(err);
  }
}

test();
