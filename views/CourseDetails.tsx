
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, PlayCircle, Clock, BookOpen, ShieldCheck, Loader2 } from 'lucide-react';
import { COURSES } from '../constants';
import { supabase } from '../services/supabase';

interface Props {
  onAddToCart: (id: string) => void;
}

export default function CourseDetails({ onAddToCart }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  async function fetchCourse() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (data) {
        setCourse(data);
      } else {
        // Fallback para constante caso não encontre no banco (legado)
        const staticCourse = COURSES.find(c => c.id === id);
        if (staticCourse) setCourse(staticCourse);
      }
    } catch (err) {
      console.error("Erro ao carregar curso:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!course) return <div className="p-20 text-center">Curso não encontrado</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-4xl font-bold">{course.title}</h1>
            <p className="text-xl text-slate-300 max-w-2xl">{course.description}</p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-emerald-500 w-5 h-5" />
                <span>Certificado Incluso</span>
              </div>
              <div className="flex items-center gap-2">
                <PlayCircle className="text-indigo-400 w-5 h-5" />
                <span>{(course.modules || []).length} Módulos</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-2xl text-slate-900 border border-slate-200">
            <img src={course.thumbnail} className="rounded-lg mb-6 aspect-video object-cover" />
            <div className="text-3xl font-extrabold mb-1">R$ {course.price?.toFixed(2)}</div>
            
            <div className="space-y-3">
              <button 
                onClick={() => navigate(`/checkout/${course.id}`)}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                Comprar Agora
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={16} />
              <span>Garantia de 7 dias ou seu dinheiro de volta</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-8">Conteúdo do Curso</h2>
            <div className="space-y-4">
              {(course.modules || []).map((module: any, idx: number) => (
                <div key={module.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-4 font-bold flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">{idx + 1}</span>
                      {module.title}
                    </div>
                    <span className="text-slate-400 text-sm">{(module.lessons || []).length} aulas</span>
                  </div>
                  <div className="p-2">
                    {(module.lessons || []).map((lesson: any) => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group">
                        <div className="flex items-center gap-3">
                          <PlayCircle size={18} className="text-slate-400 group-hover:text-indigo-600" />
                          <span className="text-slate-700">{lesson.title}</span>
                        </div>
                        <span className="text-xs text-slate-400">{lesson.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
