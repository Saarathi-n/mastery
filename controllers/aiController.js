
import config from '../config/index.js';

export async function chatWithTutor(req, res) {
  try {
    const apiKey = config.ai.geminiApiKey;
    const { context = "", messages = [] } = req.body || {};

    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages are required" });
    }

    const contents = messages
      .filter((message) => message && typeof message.text === "string")
      .map((message) => ({
        role: message.role === "user" ? "user" : "model",
        parts: [{ text: message.text }]
      }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `You are an expert tutor for JEE and NEET students. Context: ${context}. Keep answers concise, educational, and encouraging.` }]
          },
          contents
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to retrieve response");
    }

    const replyText = data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("") || "I couldn't generate a response.";
    res.json({ reply: replyText });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to generate tutor response" });
  }
}

export default { chatWithTutor };

