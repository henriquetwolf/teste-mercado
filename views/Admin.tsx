
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
  const [mpConfig, setMpConfig] = useState({ publicKey: '', accessToken: '', mode: 'sandbox' });
  const [sales, setSales] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    instructor: '',
    price: 0,
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    description: '',
    payment_link: '', // NOVO CAMPO
    modules: [] as NewModule[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: configData } = await supabase.from('platform_settings').select('value').eq('key', 'mercadopago_config').maybeSingle();
      if (configData) setMpConfig(configData.value);

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

  const removeModule = (idx: number) => {
    const updated = [...courseForm.modules];
    updated.splice(idx, 1);
    setCourseForm({ ...courseForm, modules: updated });
  };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('courses').upsert({
        id: editingCourse?.id || undefined,
        ...courseForm,
        rating: 5.0,
        students: 0
      });

      if (!error) {
        alert("Curso salvo com sucesso!");
        setEditingCourse(null);
        fetchData();
      } else {
        throw error;
      }
    } catch (err: any) {
      alert("Erro ao salvar curso: " + err.message);
    }
    setIsSaving(false);
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({ 
          key: 'mercadopago_config', 
          value: mpConfig 
        }, { onConflict: 'key' });

      if (error) throw error;
      alert("Configurações do Mercado Pago salvas com sucesso!");
    } catch (err: any) {
      console.error("Save settings error:", err);
      alert("Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const isConfigured = mpConfig.publicKey.length > 5 && mpConfig.accessToken.length > 10;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white hidden lg:flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center"><Settings size={18} /></div>
            Admin Hub
          </div>
        </div>
        <nav className="p-4 flex-grow space-y-2">
          <button onClick={() => { setActiveTab('dashboard'); setEditingCourse(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BarChart3 size={20} /> Dashboard
          </button>
          <button onClick={() => { setActiveTab('courses'); setEditingCourse(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'courses' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BookOpen size={20} /> Meus Cursos
          </button>
          <button onClick={() => { setActiveTab('sales'); setEditingCourse(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sales' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <CreditCard size={20} /> Vendas
          </button>
          <button onClick={() => { setActiveTab('settings'); setEditingCourse(null); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <div className="flex items-center gap-3"><Settings size={20} /> Mercado Pago</div>
            {!isConfigured && <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-8 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-sky-500" size={48} /></div>
        ) : (
          <>
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 capitalize">
                  {activeTab === 'courses' ? 'Gerenciar Cursos' : activeTab === 'settings' ? 'Mercado Pago' : activeTab}
                </h1>
                <p className="text-slate-500">Controle total da sua plataforma EduVantage</p>
              </div>
              {activeTab === 'courses' && !editingCourse && (
                <button 
                  onClick={startNewCourse}
                  className="bg-sky-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-700 transition-all shadow-lg shadow-sky-100"
                >
                  <Plus size={20} /> Cadastrar Novo Curso
                </button>
              )}
            </header>

            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="bg-gradient-to-r from-sky-600 to-sky-500 rounded-[32px] p-8 text-white shadow-xl shadow-sky-100 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Gerencie suas vendas reais</h2>
                    <p className="text-sky-100 max-w-md">Para o dinheiro cair na sua conta, gere um "Link de Pagamento" no seu Mercado Pago e cole no cadastro do curso.</p>
                  </div>
                  <button 
                    onClick={startNewCourse}
                    className="bg-white text-sky-600 px-8 py-4 rounded-2xl font-black text-lg hover:bg-sky-50 transition-all flex items-center gap-3 shadow-lg group active:scale-95"
                  >
                    <PlusCircle size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    NOVO CURSO
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><DollarSign size={20} /></div>
                    <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Faturamento Simulado</div>
                    <div className="text-3xl font-black text-slate-900 mt-1">R$ {sales.reduce((acc, s) => acc + (s.amount || 0), 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="bg-sky-100 text-sky-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><BookOpen size={20} /></div>
                    <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Cursos Ativos</div>
                    <div className="text-3xl font-black text-slate-900 mt-1">{courses.length}</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="bg-amber-100 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Users size={20} /></div>
                    <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Vendas Totais</div>
                    <div className="text-3xl font-black text-slate-900 mt-1">{sales.length}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="animate-in fade-in">
                {editingCourse ? (
                  <form onSubmit={saveCourse} className="space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-5xl mx-auto">
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                       <h2 className="text-xl font-bold text-slate-900">{editingCourse.id ? 'Editar Curso' : 'Criar Novo Curso'}</h2>
                       <button type="button" onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-600 font-bold">Cancelar</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div>
                            <label className="text-xs font-bold uppercase text-slate-400 mb-1 block tracking-wider">Nome do Curso</label>
                            <input required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sky-50 transition-all" />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase text-slate-400 mb-1 block tracking-wider">Preço de Venda (R$)</label>
                            <input type="number" step="0.01" required value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sky-50 transition-all" />
                          </div>
                          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                            <label className="text-xs font-bold uppercase text-amber-600 mb-2 flex items-center gap-2"><LinkIcon size={14}/> Link de Pagamento Real (Mercado Pago)</label>
                            <input 
                              type="url"
                              value={courseForm.payment_link} 
                              onChange={e => setCourseForm({...courseForm, payment_link: e.target.value})} 
                              className="w-full p-3 bg-white border border-amber-200 rounded-lg outline-none text-sm text-slate-700" 
                              placeholder="https://mpago.la/seu-link-aqui"
                            />
                            <p className="text-[10px] text-amber-500 mt-2 font-medium uppercase tracking-tight italic">Cole aqui o link que você criou no painel do Mercado Pago para receber dinheiro real.</p>
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div>
                            <label className="text-xs font-bold uppercase text-slate-400 mb-1 block tracking-wider">Imagem de Capa (URL)</label>
                            <input required value={courseForm.thumbnail} onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sky-50 transition-all" />
                            <div className="mt-4 rounded-2xl overflow-hidden border-2 border-slate-100 aspect-video relative">
                               {courseForm.thumbnail && <img src={courseForm.thumbnail} className="w-full h-full object-cover" />}
                            </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Descrição</label>
                       <textarea rows={4} value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sky-50 resize-none" />
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-100">
                       <div className="flex justify-between items-center">
                          <h3 className="font-bold flex items-center gap-2 text-slate-700 text-lg"><PlusCircle className="text-sky-500" /> Grade do Curso</h3>
                          <button type="button" onClick={addModule} className="bg-sky-50 text-sky-600 px-4 py-2 rounded-xl font-bold text-sm">+ Novo Módulo</button>
                       </div>
                       
                       <div className="space-y-6">
                          {courseForm.modules.map((module, mIdx) => (
                            <div key={module.id} className="border border-slate-200 rounded-[24px] overflow-hidden bg-white shadow-sm">
                               <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-4">
                                  <div className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">{mIdx + 1}</div>
                                  <input value={module.title} onChange={e => {
                                    const updated = [...courseForm.modules];
                                    updated[mIdx].title = e.target.value;
                                    setCourseForm({...courseForm, modules: updated});
                                  }} className="flex-grow bg-transparent font-bold outline-none text-slate-800" placeholder="Título do Módulo" />
                                  <button type="button" onClick={() => addLesson(mIdx)} className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">+ Aula</button>
                                  <button type="button" onClick={() => removeModule(mIdx)} className="text-rose-400 hover:text-rose-600 p-2"><Trash2 size={18} /></button>
                               </div>
                               <div className="p-4 space-y-4">
                                  {module.lessons.map((lesson, lIdx) => (
                                    <div key={lesson.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-4">
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <input value={lesson.title} onChange={e => {
                                            const updated = [...courseForm.modules];
                                            updated[mIdx].lessons[lIdx].title = e.target.value;
                                            setCourseForm({...courseForm, modules: updated});
                                          }} className="bg-white rounded border p-2 text-sm" placeholder="Título da Aula" />
                                          <input value={lesson.videoUrl} onChange={e => {
                                            const updated = [...courseForm.modules];
                                            updated[mIdx].lessons[lIdx].videoUrl = e.target.value;
                                            setCourseForm({...courseForm, modules: updated});
                                          }} className="bg-white rounded border p-2 text-sm font-mono" placeholder="Embed URL (YouTube)" />
                                       </div>
                                       <button type="button" onClick={() => {
                                         const updated = [...courseForm.modules];
                                         updated[mIdx].lessons.splice(lIdx, 1);
                                         setCourseForm({...courseForm, modules: updated});
                                       }} className="text-rose-400 hover:text-rose-600 self-end text-[10px] font-black uppercase">Excluir Aula</button>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    <button type="submit" disabled={isSaving} className="w-full bg-sky-600 text-white py-6 rounded-3xl font-black text-2xl hover:bg-sky-700 shadow-2xl active:scale-95 transition-all">
                        {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'PUBLICAR CURSO'}
                    </button>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                      <div key={course.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden group">
                         <div className="aspect-video relative">
                            <img src={course.thumbnail} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-4">
                               <button onClick={() => {
                                 setEditingCourse(course);
                                 setCourseForm({
                                   title: course.title,
                                   instructor: course.instructor,
                                   price: course.price,
                                   thumbnail: course.thumbnail,
                                   description: course.description || '',
                                   payment_link: course.payment_link || '',
                                   modules: course.modules || []
                                 });
                               }} className="bg-white p-3 rounded-full hover:scale-110 transition-transform"><Edit3 size={20}/></button>
                               <button onClick={async () => {
                                 if(confirm("Excluir curso?")) {
                                   await supabase.from('courses').delete().eq('id', course.id);
                                   fetchData();
                                 }
                               }} className="bg-rose-500 text-white p-3 rounded-full hover:scale-110 transition-transform"><Trash2 size={20}/></button>
                            </div>
                         </div>
                         <div className="p-6">
                            <h3 className="font-bold mb-1">{course.title}</h3>
                            <div className="flex justify-between items-center mt-4">
                               <span className="font-black text-sky-600">R$ {course.price.toFixed(2)}</span>
                               {course.payment_link ? (
                                 <span className="bg-emerald-100 text-emerald-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Link Real Ativo</span>
                               ) : (
                                 <span className="bg-amber-100 text-amber-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Somente Simulação</span>
                               )}
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
