
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { COURSES } from '../constants';
import { supabase } from '../services/supabase';

export default function Home() {
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setDbCourses(data);
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
    } finally {
      setLoading(false);
    }
  }

  // Combinar cursos estáticos com cursos do banco
  const allCourses = [...dbCourses, ...COURSES.filter(c => !dbCourses.find(db => db.id === c.id))];

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="bg-indigo-700 py-20 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-600/50 px-3 py-1 rounded-full text-sm font-medium border border-indigo-500/30">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Novo: Aulas com Tutor de IA 24/7</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight">
              Aprenda sem limites com o poder da <span className="text-indigo-300">Inteligência Artificial</span>
            </h1>
            <p className="text-lg text-indigo-100 max-w-lg">
              Plataforma de cursos certificada com fluxos de pagamento seguros e suporte educacional inteligente.
            </p>
          </div>
          <div className="flex-1 relative">
            <img 
              src="https://picsum.photos/seed/edu/600/400" 
              alt="LMS Visual" 
              className="rounded-2xl shadow-2xl border-4 border-white/10"
            />
          </div>
        </div>
      </section>

      {/* Course List */}
      <section className="max-w-7xl mx-auto px-4 mt-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Nossos Cursos</h2>
            <p className="text-slate-500">Comece sua jornada hoje mesmo</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allCourses.map(course => (
              <Link 
                key={course.id} 
                to={`/course/${course.id}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-indigo-700 flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {course.rating}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                    {course.description || "Sem descrição disponível."}
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                      {course.instructor?.charAt(0) || "U"}
                    </div>
                    <span className="text-sm text-slate-600 font-medium">{course.instructor}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-2xl font-bold text-slate-900">R$ {course.price?.toFixed(2)}</span>
                    <div className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full text-xs">Acessar</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
