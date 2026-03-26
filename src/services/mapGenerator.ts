import { GoogleGenAI } from "@google/genai";

export async function generateMapImage() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A highly detailed, artistic, stylized map of the Russian Far East (Primorsky Krai, Khabarovsk Krai, Sakhalin, Amur Oblast). Modern sports aesthetic, clean lines, navy and bright blue color palette. Minimalist but recognizable geography. No text labels. High contrast, professional graphic design style.',
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      }
    }
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
