
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  Settings, 
  BarChart3, 
  Users, 
  CreditCard, 
  Save, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  BookOpen, 
  DollarSign, 
  Loader2, 
  Edit3, 
  Key,
  AlertTriangle,
  Info,
  Globe,
  PlusCircle,
  Play,
  Link as LinkIcon
} from 'lucide-react';

interface NewLesson {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  description: string;
}

interface NewModule {
  id: string;
  title: string;
  lessons: NewLesson[];
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'sales' | 'courses'>('dashboard');
  const [pgConfig, setPgConfig] = useState({ email: '', token: '', mode: 'production' });
  const [sales, setSales] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    instructor: '',
    price: 0,
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    description: '',
    payment_link: '', 
    modules: [] as NewModule[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: configData } = await supabase.from('platform_settings').select('value').eq('key', 'pagseguro_config').maybeSingle();
      if (configData) setPgConfig(configData.value);

      const { data: salesData } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
      if (salesData) setSales(salesData);

      const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (coursesData) setCourses(coursesData);
    } catch (err) {
      console.error("Erro ao carregar dados admin:", err);
    }
    setLoading(false);
  }

  const startNewCourse = () => {
    setEditingCourse({ id: null });
    setCourseForm({
      title: '',
      instructor: '',
      price: 0,
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
      description: '',
      payment_link: '',
      modules: []
    });
    setActiveTab('courses');
  };

  const addModule = () => {
    const newModule: NewModule = { id: Math.random().toString(36).substr(2, 9), title: 'Novo Módulo', lessons: [] };
    setCourseForm({ ...courseForm, modules: [...courseForm.modules, newModule] });
  };

  const addLesson = (moduleIdx: number) => {
    const newLesson: NewLesson = { id: Math.random().toString(36).substr(2, 9), title: 'Nova Aula', duration: '10:00', videoUrl: '', description: '' };
    const updatedModules = [...courseForm.modules];
    updatedModules[moduleIdx].lessons.push(newLesson);
    setCourseForm({ ...courseForm, modules: updatedModules });
  };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await supabase.from('courses').upsert({
        id: editingCourse?.id || undefined,
        ...courseForm,
        rating: 5.0,
        students: 0
      });
      alert("Curso salvo com sucesso!");
      setEditingCourse(null);
      fetchData();
    } catch (err: any) {
      alert("Erro ao salvar curso.");
    }
    setIsSaving(false);
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await supabase.from('platform_settings').upsert({ key: 'pagseguro_config', value: pgConfig }, { onConflict: 'key' });
      alert("Configurações do PagSeguro salvas!");
    } catch (err) {
      alert("Erro ao salvar.");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="w-64 bg-slate-900 text-white hidden lg:flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center"><Settings size={18} /></div>
            Admin Hub
          </div>
        </div>
        <nav className="p-4 flex-grow space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BarChart3 size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('courses')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'courses' ? 'bg-emerald-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BookOpen size={20} /> Meus Cursos
          </button>
          <button onClick={() => setActiveTab('sales')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sales' ? 'bg-emerald-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <CreditCard size={20} /> Vendas
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-emerald-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Key size={20} /> PagSeguro
          </button>
        </nav>
      </div>

      <div className="flex-grow p-8 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>
        ) : (
          <>
            <header className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 capitalize">{activeTab}</h1>
                <p className="text-slate-500">Painel de controle PagSeguro & LMS</p>
              </div>
              {activeTab === 'courses' && !editingCourse && (
                <button onClick={startNewCourse} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg">
                  <Plus size={20} /> Novo Curso
                </button>
              )}
            </header>

            {activeTab === 'settings' && (
              <form onSubmit={saveSettings} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-2xl">
                <div className="flex items-center gap-3 mb-4 text-emerald-600">
                   <ShieldCheck size={32} />
                   <h2 className="text-xl font-bold">Credenciais PagSeguro</h2>
                </div>
                <div>
                   <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">E-mail da Conta</label>
                   <input value={pgConfig.email} onChange={e => setPgConfig({...pgConfig, email: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                   <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Token PagSeguro</label>
                   <input type="password" value={pgConfig.token} onChange={e => setPgConfig({...pgConfig, token: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-xl" />
                </div>
                <button type="submit" disabled={isSaving} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold">
                   {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar Configurações'}
                </button>
              </form>
            )}

            {activeTab === 'courses' && (
               editingCourse ? (
                 <form onSubmit={saveCourse} className="space-y-8 bg-white p-8 rounded-3xl border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div>
                            <label className="text-xs font-bold uppercase text-slate-400">Título</label>
                            <input required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-xl" />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase text-slate-400">Preço (R$)</label>
                            <input type="number" step="0.01" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-xl" />
                          </div>
                          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                            <label className="text-xs font-bold uppercase text-emerald-600 mb-2 flex items-center gap-2"><LinkIcon size={14}/> Link do Botão PagSeguro</label>
                            <input 
                              type="url"
                              value={courseForm.payment_link} 
                              onChange={e => setCourseForm({...courseForm, payment_link: e.target.value})} 
                              className="w-full p-3 bg-white border border-emerald-200 rounded-lg outline-none text-sm" 
                              placeholder="https://pagseguro.uol.com.br/v2/checkout/payment.html?code=..."
                            />
                            <p className="text-[10px] text-emerald-500 mt-2 font-medium">Gere um botão/link de pagamento no painel do PagSeguro e cole aqui.</p>
                          </div>
                       </div>
                       <div>
                          <label className="text-xs font-bold uppercase text-slate-400">Imagem da Capa</label>
                          <input value={courseForm.thumbnail} onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-xl" />
                          <img src={courseForm.thumbnail} className="mt-4 rounded-xl aspect-video object-cover border" />
                       </div>
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-xl shadow-lg">
                        {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'PUBLICAR CURSO'}
                    </button>
                 </form>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {courses.map(course => (
                     <div key={course.id} className="bg-white rounded-3xl border overflow-hidden">
                        <img src={course.thumbnail} className="aspect-video object-cover" />
                        <div className="p-6">
                           <h3 className="font-bold">{course.title}</h3>
                           <div className="flex justify-between items-center mt-4">
                              <span className="font-black text-emerald-600">R$ {course.price.toFixed(2)}</span>
                              <button onClick={() => {
                                setEditingCourse(course);
                                setCourseForm({...course, modules: course.modules || []});
                              }} className="p-2 text-slate-400 hover:text-emerald-600"><Edit3 size={18}/></button>
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               )
            )}
            
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border shadow-sm">
                   <DollarSign className="text-emerald-500 mb-4" />
                   <div className="text-slate-400 text-xs font-bold uppercase">Vendas Registradas</div>
                   <div className="text-3xl font-black">R$ {sales.reduce((acc, s) => acc + (s.amount || 0), 0).toFixed(2)}</div>
                </div>
                <div className="bg-white p-8 rounded-3xl border shadow-sm">
                   <Users className="text-sky-500 mb-4" />
                   <div className="text-slate-400 text-xs font-bold uppercase">Alunos Ativos</div>
                   <div className="text-3xl font-black">{sales.length}</div>
                </div>
                <div className="bg-white p-8 rounded-3xl border shadow-sm">
                   <BookOpen className="text-amber-500 mb-4" />
                   <div className="text-slate-400 text-xs font-bold uppercase">Cursos Criados</div>
                   <div className="text-3xl font-black">{courses.length}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
