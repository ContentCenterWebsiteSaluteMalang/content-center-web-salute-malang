import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/generate-content", async (req, res) => {
    try {
      const { page, section, subpage, notes } = req.body;
      
      const prompt = `Anda adalah seorang asisten AI yang membantu mengisi konten untuk website.
Tugas Anda adalah merumuskan konten yang menarik dan profesional berdasarkan konteks berikut:

Halaman Web: ${page || "-"}
Sub-Halaman: ${subpage || "-"}
Bagian / Section: ${section || "-"}
Catatan / Instruksi tambahan: ${notes || "-"}

Tolong hasilkan:
1. "konten_text": Teks/copywriting utama untuk bagian/section ini. Harus profesional, menarik, dan sesuai dengan konteks halaman web.
2. "cta_text": Teks singkat untuk tombol Call To Action (jika relevan). Kosongkan jika tidak relevan.

Balas hanya dengan format JSON yang valid dan tanpa markdown block seperti ini:
{
  "konten_text": "...",
  "cta_text": "..."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response text from Gemini");

      const jsonResponse = JSON.parse(text);
      res.json(jsonResponse);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Gagal menghasilkan konten dengan AI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
