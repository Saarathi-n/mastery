const key = 'AIzaSyAj1EsyiYbWqi1HTlFDuSEQnA1vOKlcSt4';
const contents = [{ role: 'user', parts: [{ text: 'hi' }] }];
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents })
}).then(r => r.json()).then(console.log).catch(console.error);
