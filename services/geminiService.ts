
import { GoogleGenAI } from "@google/genai";

export const askAITutor = async (question: string, context: string) => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "O Tutor de IA não está configurado (API_KEY ausente).";
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um tutor de IA especializado chamado EduBot dentro de uma plataforma de cursos. 
      Responda de forma didática e curta em português.
      
      Contexto do curso atual: ${context}
      
      Pergunta do aluno: ${question}`,
    });

    return response.text || "Desculpe, não consegui processar sua dúvida agora.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com o tutor de IA. Verifique sua chave de API.";
  }
};
