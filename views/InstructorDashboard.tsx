
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  LayoutDashboard, 
  BookOpen, 
  DollarSign, 
  Plus, 
  Users, 
  Loader2, 
  Save, 
  CreditCard,
  Zap,
  Info,
  X,
  Settings,
  ArrowLeft,
  Key,
  Lock,
  Trash2,
  PlayCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SidebarBtn = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
  >
    {icon} {label}
  </button>
);

const StatCard = ({ label, value, icon, trend }: any) => (
  <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
    <div className="relative z-10 space-y-6">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{label}</p>
        <h4 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h4>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 inline-block px-2 py-1 rounded-lg">{trend}</p>
    </div>
  </div>
);

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'marketplace' | 'edit-course'>('overview');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({ totalRevenue: 0, totalStudents: 0, activeCourses: 0 });

  const [paymentConfig, setPaymentConfig] = useState({
    gateway: 'mercadopago',
    mercadopagoPublicKey: '',
    mercadopagoAccessToken: ''
  });

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    price: '',
    thumbnail: 'https://picsum.photos/seed/course/800/450'
  });

  useEffect(() => {
    loadInstructorData();
  }, []);

  async function loadInstructorData() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);

    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', session.user.id);
      
      if (coursesData) {
        setCourses(coursesData);
        setStats(prev => ({ ...prev, activeCourses: coursesData.length }));
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('payment_config')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.payment_config) {
        setPaymentConfig(prev => ({ ...prev, ...profile.payment_config }));
      }

      const { data: sales } = await supabase
        .from('sales')
        .select('amount, status')
        .in('course_id', (coursesData || []).map(c => c.id))
        .eq('status', 'Pago');
      
      if (sales) {
        const total = sales.reduce((acc, s) => acc + s.amount, 0);
        setStats(prev => ({ ...prev, totalRevenue: total, totalStudents: sales.length }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSavePaymentConfig = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ payment_config: paymentConfig })
        .eq('id', user.id);
      
      if (error) throw error;
      alert("Configurações do Mercado Pago salvas com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: newCourse.title,
          description: newCourse.description,
          price: parseFloat(newCourse.price),
          thumbnail: newCourse.thumbnail,
          instructor: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Professor',
          instructor_id: user.id,
          modules: [],
          rating: 5.0,
          students: 0
        })
        .select()
        .single();

      if (error) throw error;

      setCourses([data, ...courses]);
      setStats(prev => ({ ...prev, activeCourses: prev.activeCourses + 1 }));
      setShowCreateModal(false);
      setNewCourse({ title: '', description: '', price: '', thumbnail: 'https://picsum.photos/seed/course/800/450' });
      setEditingCourse(data);
      setActiveTab('edit-course');
    } catch (err: any) {
      alert("Erro ao criar curso.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (course: any) => { 
    setEditingCourse({ ...course, modules: course.modules || [] }); 
    setActiveTab('edit-course'); 
  };

  const handleSaveCourseContent = async () => {
    if (!editingCourse) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('courses').update({ 
        modules: editingCourse.modules, 
        title: editingCourse.title, 
        price: parseFloat(editingCourse.price),
        description: editingCourse.description
      }).eq('id', editingCourse.id);
      
      if (error) throw error;
      alert("Curso atualizado com sucesso!");
      loadInstructorData();
      setActiveTab('courses');
    } catch (err: any) { 
      alert("Erro ao salvar: " + err.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const addModule = () => {
    const newModule = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Novo Módulo',
      lessons: []
    };
    setEditingCourse({ ...editingCourse, modules: [...editingCourse.modules, newModule] });
  };

  const removeModule = (moduleId: string) => {
    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.filter((m: any) => m.id !== moduleId)
    });
  };

  const addLesson = (moduleId: string) => {
    const newLesson = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Nova Aula',
      duration: '00:00',
      videoUrl: '',
      description: ''
    };
    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.map((m: any) => 
        m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
      )
    });
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.map((m: any) => 
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== lessonId) } : m
      )
    });
  };

  const updateModuleTitle = (moduleId: string, title: string) => {
    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.map((m: any) => 
        m.id === moduleId ? { ...m, title } : m
      )
    });
  };

  const updateLesson = (moduleId: string, lessonId: string, field: string, value: string) => {
    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.map((m: any) => 
        m.id === moduleId ? {
          ...m,
          lessons: m.lessons.map((l: any) => l.id === lessonId ? { ...l, [field]: value } : l)
        } : m
      )
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <div className="w-full lg:w-80 bg-slate-950 text-white shrink-0 p-8 flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
             <Zap size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Prof. Hub</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Mercado Pago LMS</p>
          </div>
        </div>

        <nav className="space-y-3">
          <SidebarBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={18} />} label="Resultados" />
          <SidebarBtn active={activeTab === 'courses' || activeTab === 'edit-course'} onClick={() => setActiveTab('courses')} icon={<BookOpen size={18} />} label="Meus Cursos" />
          <SidebarBtn active={activeTab === 'marketplace'} onClick={() => setActiveTab('marketplace')} icon={<CreditCard size={18} />} label="Mercado Pago" />
        </nav>
      </div>

      <div className="flex-grow p-8 lg:p-12 overflow-y-auto relative">
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-fade-in">
            <header>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Painel Geral</h1>
              <p className="text-slate-500 font-medium text-sm">Visão consolidada das suas vendas.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard label="Receita Bruta" value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<DollarSign className="text-indigo-500" />} trend="Total vendido" />
              <StatCard label="Total Alunos" value={stats.totalStudents.toString()} icon={<Users className="text-sky-500" />} trend="Estudantes" />
              <StatCard label="Cursos Ativos" value={stats.activeCourses.toString()} icon={<BookOpen className="text-amber-500" />} trend="Publicados" />
            </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="max-w-3xl animate-fade-in space-y-8">
            <header>
              <div className="flex items-center gap-4 mb-2">
                 <img src="https://logodownload.org/wp-content/uploads/2017/06/mercado-pago-logo-1.png" className="h-8" alt="Mercado Pago" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 italic uppercase">Credenciais de Recebimento</h1>
              <p className="text-slate-500 font-medium">Configure seu Mercado Pago para receber pelas vendas dos seus cursos.</p>
            </header>
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
               <div className="space-y-6">
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Public Key (Produção)</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" value={paymentConfig.mercadopagoPublicKey} onChange={e => setPaymentConfig({...paymentConfig, mercadopagoPublicKey: e.target.value})} className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none" placeholder="APP_USR-..." />
                      </div>
                  </div>
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Access Token (Produção)</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="password" value={paymentConfig.mercadopagoAccessToken} onChange={e => setPaymentConfig({...paymentConfig, mercadopagoAccessToken: e.target.value})} className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none" placeholder="APP_USR-..." />
                      </div>
                      <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase leading-relaxed">
                        Obtenha em: Suas Integrações &gt; Credenciais de Produção.
                      </p>
                  </div>
               </div>
               <button onClick={handleSavePaymentConfig} disabled={isSaving} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3">
                  {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar Credenciais</>}
               </button>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
           <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-black text-slate-900 italic uppercase">Meus Cursos</h1>
                 <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-200 transition-transform active:scale-95">
                   <Plus size={18} /> Novo Treinamento
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-[40px] border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all flex flex-col">
                     <div className="aspect-video relative overflow-hidden">
                        <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={course.title} />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button onClick={() => startEditing(course)} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
                              <Settings size={14} /> Editar
                           </button>
                        </div>
                     </div>
                     <div className="p-8">
                        <h3 className="font-black text-slate-900 text-xl line-clamp-1 mb-2 italic uppercase tracking-tighter">{course.title}</h3>
                        <div className="text-2xl font-black text-indigo-600 tracking-tighter">R$ {course.price?.toFixed(2)}</div>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        )}

        {activeTab === 'edit-course' && editingCourse && (
          <div className="animate-fade-in space-y-12 pb-20">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveTab('courses')} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Editando: {editingCourse.title}</h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Ajuste o conteúdo e a precificação do seu treinamento.</p>
                  </div>
                </div>
                <button onClick={handleSaveCourseContent} disabled={isSaving} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar Alterações</>}
                </button>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                   <section className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                         <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><BookOpen size={20} /></div>
                         <h3 className="text-lg font-black uppercase italic tracking-tight">Estrutura Curricular</h3>
                      </div>

                      <div className="space-y-6">
                         {editingCourse.modules.map((module: any, mIdx: number) => (
                           <div key={module.id} className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50">
                              <div className="p-6 bg-slate-100 flex items-center justify-between gap-4">
                                 <div className="flex-grow flex items-center gap-4">
                                    <span className="text-[10px] font-black bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-lg">{mIdx + 1}</span>
                                    <input 
                                      type="text" 
                                      value={module.title} 
                                      onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                                      className="bg-transparent border-none font-black uppercase text-xs outline-none focus:text-indigo-600 flex-grow"
                                      placeholder="Título do Módulo"
                                    />
                                 </div>
                                 <button onClick={() => removeModule(module.id)} className="text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                              </div>
                              <div className="p-6 space-y-4">
                                 {module.lessons.map((lesson: any, lIdx: number) => (
                                   <div key={lesson.id} className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 group">
                                      <div className="flex justify-between items-center">
                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aula {lIdx + 1}</span>
                                         <button onClick={() => removeLesson(module.id, lesson.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition-all"><X size={14} /></button>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Título da Aula</label>
                                            <input 
                                              type="text" 
                                              value={lesson.title} 
                                              onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none"
                                            />
                                         </div>
                                         <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Link do Vídeo (Embed)</label>
                                            <input 
                                              type="text" 
                                              value={lesson.videoUrl} 
                                              onChange={(e) => updateLesson(module.id, lesson.id, 'videoUrl', e.target.value)}
                                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none"
                                              placeholder="https://youtube.com/embed/..."
                                            />
                                         </div>
                                      </div>
                                      <div className="flex gap-4">
                                        <div className="w-32 space-y-1">
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Duração</label>
                                          <input 
                                              type="text" 
                                              value={lesson.duration} 
                                              onChange={(e) => updateLesson(module.id, lesson.id, 'duration', e.target.value)}
                                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none"
                                              placeholder="10:00"
                                            />
                                        </div>
                                        <div className="flex-grow space-y-1">
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição curta</label>
                                          <input 
                                              type="text" 
                                              value={lesson.description} 
                                              onChange={(e) => updateLesson(module.id, lesson.id, 'description', e.target.value)}
                                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none"
                                            />
                                        </div>
                                      </div>
                                   </div>
                                 ))}
                                 <button onClick={() => addLesson(module.id)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2">
                                    <Plus size={14} /> Adicionar Aula ao Módulo
                                 </button>
                              </div>
                           </div>
                         ))}
                         <button onClick={addModule} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl">
                            <Plus size={18} /> Novo Módulo Estrutural
                         </button>
                      </div>
                   </section>
                </div>

                <aside className="space-y-8">
                   <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                      <h4 className="text-sm font-black uppercase italic tracking-widest border-b border-slate-50 pb-4">Informações de Venda</h4>
                      <div className="space-y-4">
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço do Treinamento (R$)</label>
                            <div className="relative">
                               <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                               <input 
                                 type="number" 
                                 value={editingCourse.price} 
                                 onChange={(e) => setEditingCourse({...editingCourse, price: e.target.value})}
                                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-black text-xl text-slate-900 outline-none focus:ring-4 focus:ring-emerald-50" 
                               />
                            </div>
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Título Público</label>
                            <input 
                               type="text" 
                               value={editingCourse.title} 
                               onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                               className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm outline-none" 
                            />
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descrição Breve</label>
                            <textarea 
                               rows={4}
                               value={editingCourse.description} 
                               onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                               className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium text-sm outline-none resize-none" 
                            />
                         </div>
                      </div>
                   </div>

                   <div className="bg-indigo-600 p-8 rounded-[40px] text-white space-y-4 shadow-xl shadow-indigo-100">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Zap size={20} /></div>
                      <h4 className="font-black italic uppercase tracking-tighter">Dica do Professor</h4>
                      <p className="text-xs font-medium opacity-80 leading-relaxed">Módulos bem estruturados aumentam a taxa de conclusão dos alunos em até 40%. Use títulos claros e diretos.</p>
                   </div>
                </aside>
             </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
             <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-zoom-in">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter">Novo Treinamento</h3>
                   <button onClick={() => setShowCreateModal(false)}><X size={20} /></button>
                </div>
                <form onSubmit={handleCreateCourse} className="p-10 space-y-6">
                   <input required type="text" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} placeholder="Título do Curso" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" />
                   <input required type="number" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: e.target.value})} placeholder="Preço (R$)" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" />
                   <button type="submit" disabled={isSaving} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-lg shadow-xl shadow-indigo-100 transition-transform active:scale-95">Criar Curso</button>
                </form>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
