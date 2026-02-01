
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Award, BookOpen, Clock, Loader2, Sparkles } from 'lucide-react';
import { COURSES } from '../constants';
import { supabase } from '../services/supabase';

export default function MyCourses() {
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEnrollments();
  }, []);

  async function fetchMyEnrollments() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', session.user.id);

      if (error) throw error;
      if (data) setPurchasedIds(data.map(item => item.course_id));
    } catch (err) {
      console.error("Erro ao buscar matrículas:", err);
    } finally {
      setLoading(false);
    }
  }

  const myCourses = COURSES.filter(c => purchasedIds.includes(c.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-indigo-700 pt-16 pb-24 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-indigo-300" />
            <h1 className="text-4xl font-extrabold">Meus Cursos</h1>
          </div>
          <p className="text-indigo-100">Continue sua jornada de aprendizado de onde parou.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12">
        {myCourses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-200">
            <BookOpen className="mx-auto w-16 h-16 text-slate-200 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Você ainda não possui cursos</h2>
            <p className="text-slate-500 mb-8">Explore nosso catálogo e comece a estudar hoje mesmo!</p>
            <Link to="/" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all inline-block">
              Ver Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myCourses.map(course => (
              <div key={course.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all group">
                <div className="aspect-video relative overflow-hidden">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/classroom/${course.id}`} className="bg-white text-indigo-700 w-14 h-14 rounded-full flex items-center justify-center shadow-xl">
                      <PlayCircle size={32} />
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{course.title}</h3>
                  </div>
                  
                  {/* Fake Progress Bar */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>Progresso</span>
                      <span>35%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[35%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={14} />
                      <span>{course.modules.length} Módulos</span>
                    </div>
                    <Link 
                      to={`/classroom/${course.id}`}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      Continuar <PlayCircle size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="max-w-7xl mx-auto px-4 mt-20">
        <div className="bg-emerald-600 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
          <div className="z-10">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <Award className="text-emerald-200" />
              Certificados Verificados
            </h2>
            <p className="text-emerald-50 text-sm max-w-md opacity-90">
              Complete 100% das aulas e avaliações para desbloquear seu certificado com código de autenticidade.
            </p>
          </div>
          <button className="bg-white text-emerald-700 px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-all z-10 shadow-lg">
            Meus Certificados
          </button>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-50"></div>
        </div>
      </section>
    </div>
  );
}
