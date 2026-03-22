require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from this directory
app.use(express.static(__dirname));

// Secure API endpoint that proxies exactly what the frontend used to do
app.post('/api/generate', async (req, res) => {
    try {
        const { platform, tone, context, hasImage } = req.body;
        
        if (!platform || !tone || !context) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const prompt = `Act as an expert social media manager. Generate exactly 5 highly engaging, algorithm-optimized captions for ${platform}.
The tone should be: ${tone}.
Context for the post: ${context}.
${hasImage ? 'The user has attached a photo corresponding to this context.' : ''}

Rules:
1. Provide exactly 5 distinct options.
2. Include relevant emojis and hashtags optimized for ${platform}.
3. Format the response as a simple list separated by "$$$" between each caption. Do NOT use numbers, bullet points, or introductory text. Just the caption content and the "$$$" separator.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "CaptionGen",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "nvidia/nemotron-3-super-120b-a12b:free",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const textResponse = data.choices[0].message.content;
        
        res.json({ captions: textResponse });

    } catch (error) {
        console.error('Backend Error:', error);
        res.status(500).json({ error: 'Failed to generate captions on the backend. Please try again.' });
    }
});

app.listen(PORT, () => {
    console.log(`Secure backend server running at http://localhost:${PORT}`);
    console.log(`API Key loaded: ${process.env.OPENROUTER_API_KEY ? 'Yes' : 'No'}`);
});
