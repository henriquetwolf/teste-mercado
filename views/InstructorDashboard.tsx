
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
  TrendingUp,
  Zap,
  Info,
  X,
  Image as ImageIcon,
  Settings,
  Trash2,
  Play,
  Clock,
  ChevronRight,
  ArrowLeft,
  Mail,
  Key
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

  // Stats
  const [stats, setStats] = useState({ totalRevenue: 0, totalStudents: 0, activeCourses: 0 });

  // PagSeguro Config
  const [paymentConfig, setPaymentConfig] = useState({
    gateway: 'pagseguro',
    pagseguroEmail: '',
    pagseguroToken: ''
  });

  // Novo Curso State
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
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
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
        setPaymentConfig(profile.payment_config);
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
      alert("Erro ao criar curso. Verifique se as tabelas do banco foram criadas corretamente via SQL Editor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePaymentConfig = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ payment_config: paymentConfig })
        .eq('id', user.id);
      
      if (error) throw error;
      alert("Configurações do PagSeguro salvas!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (course: any) => {
    setEditingCourse({ ...course });
    setActiveTab('edit-course');
  };

  const handleAddModule = () => {
    const newModule = { id: 'm' + Date.now(), title: 'Novo Módulo', lessons: [] };
    setEditingCourse({ ...editingCourse, modules: [...(editingCourse.modules || []), newModule] });
  };

  const handleAddLesson = (moduleId: string) => {
    const newLesson = { id: 'l' + Date.now(), title: 'Nova Aula', duration: '10:00', videoUrl: '', description: '' };
    const updatedModules = editingCourse.modules.map((m: any) => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m);
    setEditingCourse({ ...editingCourse, modules: updatedModules });
  };

  const handleUpdateLesson = (moduleId: string, lessonId: string, fields: any) => {
    const updatedModules = editingCourse.modules.map((m: any) => {
      if (m.id === moduleId) {
        const updatedLessons = m.lessons.map((l: any) => l.id === lessonId ? { ...l, ...fields } : l);
        return { ...m, lessons: updatedLessons };
      }
      return m;
    });
    setEditingCourse({ ...editingCourse, modules: updatedModules });
  };

  const handleSaveCourseContent = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          modules: editingCourse.modules,
          title: editingCourse.title,
          description: editingCourse.description,
          price: editingCourse.price,
          thumbnail: editingCourse.thumbnail
        })
        .eq('id', editingCourse.id);
      
      if (error) throw error;
      alert("Curso atualizado!");
      loadInstructorData();
      setActiveTab('courses');
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
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
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">PagSeguro LMS</p>
          </div>
        </div>

        <nav className="space-y-3">
          <SidebarBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={18} />} label="Resultados" />
          <SidebarBtn active={activeTab === 'courses' || activeTab === 'edit-course'} onClick={() => setActiveTab('courses')} icon={<BookOpen size={18} />} label="Meus Cursos" />
          <SidebarBtn active={activeTab === 'marketplace'} onClick={() => setActiveTab('marketplace')} icon={<CreditCard size={18} />} label="PagSeguro" />
        </nav>
      </div>

      <div className="flex-grow p-8 lg:p-12 overflow-y-auto relative">
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-fade-in">
            <header>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Minha Performance</h1>
              <p className="text-slate-500 font-medium text-sm">Vendas processadas via PagSeguro.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard label="Receita Bruta" value={`R$ ${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign className="text-indigo-500" />} trend="Total vendido" />
              <StatCard label="Total Alunos" value={stats.totalStudents.toString()} icon={<Users className="text-sky-500" />} trend="Estudantes" />
            </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="max-w-3xl animate-fade-in space-y-8">
            <header>
              <div className="flex items-center gap-4 mb-2">
                 <img src="https://logodownload.org/wp-content/uploads/2014/10/pagseguro-logo-1.png" className="h-8" alt="PagSeguro" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 italic uppercase">Recebimento PagSeguro</h1>
              <p className="text-slate-500 font-medium">Configure sua conta PagSeguro para receber pelas vendas.</p>
            </header>
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
               <div className="space-y-6">
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">E-mail da Conta PagSeguro</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="email" value={paymentConfig.pagseguroEmail} onChange={e => setPaymentConfig({...paymentConfig, pagseguroEmail: e.target.value})} className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none" placeholder="exemplo@email.com" />
                      </div>
                  </div>
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Token de Segurança PagSeguro</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="password" value={paymentConfig.pagseguroToken} onChange={e => setPaymentConfig({...paymentConfig, pagseguroToken: e.target.value})} className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none" placeholder="Token alfanumérico..." />
                      </div>
                      <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase leading-relaxed">
                        Para obter seu token: Acesse sua conta PagSeguro > Configurações > Integrações > Gerar Token.
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
                 <h1 className="text-3xl font-black text-slate-900 italic uppercase">Cursos Criados</h1>
                 <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-200">
                   <Plus size={18} /> Novo Curso
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                    <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-xs">Nenhum curso cadastrado.</p>
                  </div>
                ) : (
                  courses.map(course => (
                    <div key={course.id} className="bg-white rounded-[40px] border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all flex flex-col">
                       <div className="aspect-video relative overflow-hidden">
                          <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={course.title} />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button onClick={() => startEditing(course)} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
                                <Settings size={14} /> Editar Grade
                             </button>
                          </div>
                       </div>
                       <div className="p-8">
                          <h3 className="font-black text-slate-900 text-xl line-clamp-1 mb-2">{course.title}</h3>
                          <div className="text-2xl font-black text-indigo-600 tracking-tighter">R$ {course.price?.toFixed(2)}</div>
                       </div>
                    </div>
                  ))
                )}
              </div>
           </div>
        )}

        {/* ... Modal Novo Curso & Editor de Conteúdo permanecem iguais à versão anterior, focando no objeto editingCourse ... */}
        {activeTab === 'edit-course' && editingCourse && (
          <div className="space-y-12 animate-fade-in pb-20">
             <button onClick={() => setActiveTab('courses')} className="flex items-center gap-2 text-slate-500 font-black text-xs uppercase hover:text-indigo-600">
                <ArrowLeft size={16} /> Voltar
             </button>
             <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
                <div className="flex-grow space-y-12 w-full">
                   <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">{editingCourse.title}</h1>
                   <div className="space-y-6">
                      <div className="flex justify-between items-center">
                         <h3 className="text-xl font-black italic uppercase tracking-tighter">Estrutura de Ensino</h3>
                         <button onClick={handleAddModule} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Plus size={14} /> Add Módulo</button>
                      </div>
                      <div className="space-y-8">
                         {editingCourse.modules?.map((module: any, mIdx: number) => (
                           <div key={module.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden">
                              <div className="bg-slate-50 p-6 flex justify-between items-center">
                                 <input className="bg-transparent font-black text-lg text-slate-900 outline-none w-full" value={module.title} onChange={(e) => {
                                    const updated = editingCourse.modules.map((m: any) => m.id === module.id ? {...m, title: e.target.value} : m);
                                    setEditingCourse({...editingCourse, modules: updated});
                                 }} />
                                 <div className="flex gap-2">
                                    <button onClick={() => handleAddLesson(module.id)} className="p-2 text-indigo-600"><Plus size={20}/></button>
                                 </div>
                              </div>
                              <div className="p-6 space-y-4">
                                 {module.lessons?.map((lesson: any) => (
                                   <div key={lesson.id} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-4">
                                      <input className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold" value={lesson.title} onChange={(e) => handleUpdateLesson(module.id, lesson.id, { title: e.target.value })} />
                                      <input className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold" placeholder="URL do Vídeo" value={lesson.videoUrl} onChange={(e) => handleUpdateLesson(module.id, lesson.id, { videoUrl: e.target.value })} />
                                   </div>
                                 ))}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
                <div className="w-full lg:w-96 shrink-0 sticky top-32">
                   <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                      <button onClick={handleSaveCourseContent} disabled={isSaving} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                         {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar Curso</>}
                      </button>
                   </div>
                </div>
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
                   <button type="submit" disabled={isSaving} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-lg">Criar Curso</button>
                </form>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
