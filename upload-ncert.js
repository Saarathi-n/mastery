
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import FormData from "form-data";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map of PDF filenames to chapter names
const chapterMap = {
  "kemh101.pdf": "Sets",
  "kemh102.pdf": "Relations and Functions",
  "kemh103.pdf": "Trigonometric Functions",
  "kemh104.pdf": "Principle of Mathematical Induction",
  "kemh105.pdf": "Complex Numbers and Quadratic Equations",
  "kemh106.pdf": "Linear Inequalities",
  "kemh107.pdf": "Permutations and Combinations",
  "kemh108.pdf": "Binomial Theorem",
  "kemh109.pdf": "Sequences and Series",
  "kemh110.pdf": "Straight Lines",
  "kemh111.pdf": "Conic Sections",
  "kemh112.pdf": "Introduction to Three Dimensional Geometry",
  "kemh113.pdf": "Limits and Derivatives",
  "kemh114.pdf": "Mathematical Reasoning",
  "kemh1a1.pdf": "Appendix 1",
  "kemh1a2.pdf": "Appendix 2",
  "kemh1an.pdf": "Answers",
  "kemh1ps.pdf": "Problem Solving Assessment",
  "kemh1sm.pdf": "Solutions to Selected Problems"
};

const baseUrl = "http://localhost:5001";
const pdfDir = path.join(__dirname, "ncert ooks", "11th Maths");

// First, we need a token! Let's create a test user to get a token, or use an existing one.
async function getToken() {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Upload Bot", email: "upload@test.com", password: "test1234" })
  });
  if (!res.ok) {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "upload@test.com", password: "test1234" })
    });
    const data = await loginRes.json();
    return data.token;
  }
  const data = await res.json();
  return data.token;
}

async function uploadPDF(token, filename, chapter) {
  const filePath = path.join(pdfDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filename}`);
    return;
  }

  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));
  formData.append("type", "ncert");
  formData.append("subject", "Mathematics");
  formData.append("chapter", chapter);
  formData.append("class", "11");

  const res = await fetch(`${baseUrl}/api/pdfs/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });

  const data = await res.json();
  if (res.ok) {
    console.log(`✓ Uploaded ${filename} (${chapter})`);
  } else {
    console.log(`✗ Failed to upload ${filename}:`, data.error);
  }
}

async function main() {
  console.log("Starting NCERT upload...");
  const token = await getToken();
  console.log("Got token, uploading PDFs...");

  for (const [filename, chapter] of Object.entries(chapterMap)) {
    await uploadPDF(token, filename, chapter);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log("Upload complete!");
}

main().catch(console.error);

