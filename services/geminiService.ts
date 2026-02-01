
import { GoogleGenAI } from "@google/genai";

// Use the API key directly from environment variables as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askAITutor = async (question: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um tutor de IA especializado chamado EduBot dentro de uma plataforma de cursos. 
      Responda de forma didática e curta.
      
      Contexto do curso atual: ${context}
      
      Pergunta do aluno: ${question}`,
    });

    // response.text is a property, not a method
    return response.text || "Desculpe, não consegui processar sua dúvida agora.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com o tutor de IA. Verifique sua chave de API.";
  }
};
