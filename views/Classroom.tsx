
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
// Fixed: Added Video icon to the imports from lucide-react
import { Send, Sparkles, ChevronRight, CheckCircle2, MessageCircle, Loader2, Video } from 'lucide-react';
import { COURSES } from '../constants';
import { askAITutor } from '../services/geminiService';
import { supabase } from '../services/supabase';

export default function Classroom() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCourseAndLesson();
  }, [courseId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  async function fetchCourseAndLesson() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();
      
      if (data) {
        setCourse(data);
        if (data.modules?.length > 0 && data.modules[0].lessons?.length > 0) {
          setCurrentLesson(data.modules[0].lessons[0]);
        }
      } else {
        const staticCourse = COURSES.find(c => c.id === courseId);
        if (staticCourse) {
          setCourse(staticCourse);
          setCurrentLesson(staticCourse.modules[0].lessons[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar sala de aula:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!course) return <div className="p-20 text-center">Curso não encontrado</div>;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQuestion = question;
    setQuestion('');
    setChat(prev => [...prev, { role: 'user', content: userQuestion }]);
    setIsAiThinking(true);

    const context = `Curso: ${course.title}, Aula atual: ${currentLesson?.title}`;
    const response = await askAITutor(userQuestion, context);
    
    setChat(prev => [...prev, { role: 'ai', content: response }]);
    setIsAiThinking(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
      {/* Video Area */}
      <div className="flex-grow flex flex-col min-w-0">
        <div className="aspect-video bg-black flex items-center justify-center">
          {currentLesson?.videoUrl ? (
            <iframe
              className="w-full h-full"
              src={currentLesson.videoUrl}
              title={currentLesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
             <div className="text-white text-center p-8">
               <Video className="mx-auto mb-4 opacity-20" size={64} />
               <p className="opacity-50">Vídeo não disponível para esta aula.</p>
             </div>
          )}
        </div>
        
        <div className="p-8 bg-white flex-grow overflow-y-auto">
          <h1 className="text-2xl font-bold mb-2">{currentLesson?.title}</h1>
          <div className="flex items-center gap-4 text-slate-500 text-sm mb-6 pb-6 border-b border-slate-100">
            <span className="font-semibold text-indigo-600">{course.title}</span>
            <span>•</span>
            <span>Instrutor: {course.instructor}</span>
          </div>
          <p className="text-slate-600 leading-relaxed max-w-3xl">
            {currentLesson?.description || "Assista a aula completa para dominar este conteúdo."}
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-[400px] border-l border-slate-800 flex flex-col bg-slate-900 overflow-hidden">
        <div className="flex-grow overflow-y-auto p-4">
          {(course.modules || []).map((module: any, mIdx: number) => (
            <div key={module.id} className="mb-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Módulo {mIdx + 1}: {module.title}</h4>
              <div className="space-y-1">
                {(module.lessons || []).map((lesson: any) => (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLesson(lesson)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${currentLesson?.id === lesson.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <div className="flex-grow min-w-0 text-sm font-medium leading-snug line-clamp-1">{lesson.title}</div>
                    <div className="text-[10px] opacity-60 mt-1 uppercase font-bold">{lesson.duration}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AI Tutor Chat */}
        <div className="h-1/2 flex flex-col border-t border-slate-800 bg-slate-900/90 backdrop-blur">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center"><Sparkles size={16} className="text-white" /></div>
             <h5 className="text-sm font-bold text-white">EduBot AI Tutor <span className="text-[10px] text-emerald-400 ml-2">GEMINI 3</span></h5>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isAiThinking && <div className="text-slate-500 text-xs italic animate-pulse">O tutor está digitando...</div>}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleAsk} className="p-4 border-t border-white/5 bg-slate-950">
            <div className="relative">
              <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Dúvida sobre a aula?" className="w-full bg-slate-900 border border-slate-700 rounded-full py-3 px-5 pr-12 text-sm text-white outline-none focus:border-indigo-500" />
              <button type="submit" disabled={isAiThinking} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50"><Send size={14} /></button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
