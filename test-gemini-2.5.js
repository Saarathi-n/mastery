const key = 'AIzaSyAj1EsyiYbWqi1HTlFDuSEQnA1vOKlcSt4';
const contents = [{ role: 'user', parts: [{ text: 'hi' }] }];
const context = "Some context";
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    systemInstruction: {
      parts: [{ text: `You are an expert tutor for JEE and NEET students. Context: ${context}. Keep answers concise, educational, and encouraging.` }]
    },
    contents
  })
}).then(r => r.json()).then(console.log).catch(console.error);
