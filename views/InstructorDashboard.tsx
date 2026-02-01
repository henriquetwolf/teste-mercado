
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  LayoutDashboard, 
  BookOpen, 
  DollarSign, 
  Plus, 
  Settings, 
  Users, 
  ChevronRight, 
  Loader2, 
  Video, 
  Trash2, 
  Edit, 
  Save, 
  X,
  CreditCard,
  Key,
  PieChart,
  TrendingUp,
  ExternalLink
} from 'lucide-react';

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'marketplace'>('overview');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState({ totalRevenue: 0, totalStudents: 0, activeCourses: 0 });

  // Course Editor State
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // Marketplace Settings
  const [paymentConfig, setPaymentConfig] = useState({
    gateway: 'mercadopago', // ou 'pagseguro'
    publicKey: '',
    accessToken: ''
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
      // Carregar Cursos do Instrutor
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('instructorId', session.user.id);
      
      if (coursesData) {
        setCourses(coursesData);
        setStats(prev => ({ ...prev, activeCourses: coursesData.length }));
      }

      // Carregar Perfil para Configurações de Pagamento
      const { data: profile } = await supabase
        .from('profiles')
        .select('payment_config')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.payment_config) {
        setPaymentConfig(profile.payment_config);
      }

      // Carregar Vendas para Estatísticas
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
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ payment_config: paymentConfig })
        .eq('id', user.id);
      
      if (error) throw error;
      alert("Configurações de recebimento atualizadas!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCourse = async () => {
    const newCourse = {
      title: 'Novo Treinamento',
      instructor: user.email.split('@')[0],
      instructorId: user.id,
      price: 97.00,
      thumbnail: 'https://picsum.photos/seed/new/800/450',
      description: 'Breve descrição do seu novo curso incrível.',
      modules: [],
      rating: 5.0,
      students: 0
    };
    
    setLoading(true);
    const { data, error } = await supabase.from('courses').insert(newCourse).select().single();
    if (data) {
      setCourses([data, ...courses]);
      setEditingCourse(data);
    }
    setLoading(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Professor */}
      <div className="w-full lg:w-72 bg-slate-900 text-white shrink-0 p-8 flex flex-col gap-8">
        <div>
          <h2 className="text-xl font-black italic tracking-tighter text-indigo-400">PROFESSOR HUB</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de Conteúdo & Vendas</p>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('courses')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'courses' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <BookOpen size={18} /> Meus Cursos
          </button>
          <button 
            onClick={() => setActiveTab('marketplace')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'marketplace' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <CreditCard size={18} /> Marketplace (Pagamento)
          </button>
        </nav>

        <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/10">
           <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Suporte ao Professor</p>
           <button className="text-xs font-bold text-indigo-400 flex items-center gap-2 hover:underline">
             Manual do Instrutor <ExternalLink size={12} />
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-8 lg:p-12 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-fade-in">
            <header>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Performance Geral</h1>
              <p className="text-slate-500 font-medium">Acompanhe seus resultados em tempo real.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard label="Receita Total" value={`R$ ${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign className="text-emerald-500" />} trend="+12%" />
              <StatCard label="Alunos Ativos" value={stats.totalStudents.toString()} icon={<Users className="text-indigo-500" />} trend="+5" />
              <StatCard label="Cursos Publicados" value={stats.activeCourses.toString()} icon={<BookOpen className="text-amber-500" />} />
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                <TrendingUp size={24} className="text-indigo-600" /> Vendas Recentes
              </h3>
              <div className="space-y-4">
                 {/* Lista de vendas aqui - placeholder por brevidade */}
                 <p className="text-sm text-slate-400 text-center py-8 italic font-medium">Suas vendas aprovadas aparecerão aqui.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-900 italic uppercase">Meus Treinamentos</h1>
                <button onClick={handleCreateCourse} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                  <Plus size={20} /> Criar Novo Curso
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {courses.map(course => (
                 <div key={course.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <div className="aspect-video relative overflow-hidden bg-slate-100">
                      <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                         <button onClick={() => setEditingCourse(course)} className="bg-white text-slate-900 p-3 rounded-full hover:scale-110 transition-transform"><Edit size={20} /></button>
                         <button className="bg-rose-500 text-white p-3 rounded-full hover:scale-110 transition-transform"><Trash2 size={20} /></button>
                      </div>
                    </div>
                    <div className="p-8">
                       <h3 className="font-black text-slate-900 text-lg mb-2 line-clamp-1">{course.title}</h3>
                       <div className="flex justify-between items-center">
                         <span className="text-indigo-600 font-black text-xl">R$ {course.price?.toFixed(2)}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded">{course.students} alunos</span>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="max-w-2xl animate-fade-in space-y-8">
            <header>
              <h1 className="text-3xl font-black text-slate-900 italic uppercase">Configuração de Recebimento</h1>
              <p className="text-slate-500 font-medium">Configure onde você deseja receber o dinheiro das suas vendas.</p>
            </header>

            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
               <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm"><Key size={24} /></div>
                 <div>
                   <h4 className="font-black text-slate-900 text-sm">Integração Direta</h4>
                   <p className="text-[10px] text-slate-500 font-bold uppercase">As vendas caem direto na sua conta do gateway.</p>
                 </div>
               </div>

               <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Selecione o Gateway</label>
                    <select 
                      value={paymentConfig.gateway} 
                      onChange={e => setPaymentConfig({...paymentConfig, gateway: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                    >
                      <option value="mercadopago">Mercado Pago</option>
                      <option value="pagseguro">PagSeguro (Próximamente)</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Public Key / Client ID</label>
                    <input 
                      type="text" 
                      value={paymentConfig.publicKey}
                      onChange={e => setPaymentConfig({...paymentConfig, publicKey: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none focus:ring-4 focus:ring-indigo-50 transition-all" 
                      placeholder="APP_USR-..."
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Access Token / Secret</label>
                    <input 
                      type="password" 
                      value={paymentConfig.accessToken}
                      onChange={e => setPaymentConfig({...paymentConfig, accessToken: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none focus:ring-4 focus:ring-indigo-50 transition-all" 
                      placeholder="••••••••••••••••"
                    />
                 </div>

                 <button 
                   onClick={handleSavePaymentConfig}
                   disabled={isSaving}
                   className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3"
                 >
                    {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar Configurações</>}
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Editor Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl animate-scale-in">
              <div className="p-8 border-b flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur z-10">
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 italic uppercase">Editor de Curso</h2>
                   <p className="text-xs text-slate-400 font-bold uppercase">{editingCourse.title}</p>
                 </div>
                 <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-900"><X size={32} /></button>
              </div>

              <div className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Título do Treinamento</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" defaultValue={editingCourse.title} />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Preço de Venda (BRL)</label>
                      <input type="number" step="0.01" className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-600 text-xl" defaultValue={editingCourse.price} />
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h4 className="font-black text-slate-900 uppercase italic">Estrutura de Aulas</h4>
                      <button className="text-xs font-black text-indigo-600 flex items-center gap-2 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-all border border-indigo-100">
                        <Plus size={14} /> Adicionar Módulo
                      </button>
                   </div>
                   <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300"><Video size={32} /></div>
                      <p className="text-slate-400 font-medium text-sm">Gerencie seus módulos e faça upload das suas aulas aqui.</p>
                      <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest">Adicionar Primeira Aula</button>
                   </div>
                </div>
              </div>

              <div className="p-8 border-t bg-slate-50 flex justify-end gap-4">
                 <button onClick={() => setEditingCourse(null)} className="px-8 py-4 font-black text-slate-400 uppercase text-xs">Descartar</button>
                 <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                    SALVAR CURSO
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value, icon, trend }: any) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all relative overflow-hidden">
    <div className="relative z-10 flex justify-between items-start">
      <div className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
          <h4 className="text-3xl font-black text-slate-900">{value}</h4>
        </div>
      </div>
      {trend && (
        <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded-lg">
          {trend}
        </span>
      )}
    </div>
    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600 opacity-[0.02] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
  </div>
);
