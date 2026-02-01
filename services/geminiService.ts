
import { GoogleGenAI } from "@google/genai";

export const askAITutor = async (question: string, context: string) => {
  try {
    // Correct initialization: always use new GoogleGenAI({apiKey: process.env.API_KEY})
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for basic Q&A task as recommended
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um tutor de IA especializado chamado EduBot dentro de uma plataforma de cursos. 
      Responda de forma didática e curta em português.
      
      Contexto do curso atual: ${context}
      
      Pergunta do aluno: ${question}`,
    });

    // Access the .text property directly (not as a function)
    return response.text || "Desculpe, não consegui processar sua dúvida agora.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com o tutor de IA. Verifique sua chave de API.";
  }
};
