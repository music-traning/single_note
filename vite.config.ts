import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// geminiProxy.js (inline plugin)
const geminiProxy = () => ({
  name: 'gemini-proxy',
  configureServer(server) {
    server.middlewares.use('/api/strategist-chat', (req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { prompt } = JSON.parse(body);
            const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
            
            if (!apiKey) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: 'API key is missing' }));
            }

            const apiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { temperature: 0.7, maxOutputTokens: 80 }
                })
              }
            );
            
            const data = await apiRes.json();
            if (!apiRes.ok) {
              res.statusCode = apiRes.status;
              return res.end(JSON.stringify(data));
            }
            
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ text }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
          }
        });
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), geminiProxy()],
})
