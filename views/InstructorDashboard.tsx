
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
  Info
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
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'marketplace'>('overview');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [stats, setStats] = useState({ totalRevenue: 0, totalStudents: 0, activeCourses: 0 });

  const [paymentConfig, setPaymentConfig] = useState({
    gateway: 'mercadopago',
    pagseguroEmail: '',
    pagseguroToken: '',
    mercadopagoPublicKey: '',
    mercadopagoAccessToken: ''
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
        .eq('instructorId', session.user.id);
      
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

  const handleSavePaymentConfig = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ payment_config: paymentConfig })
        .eq('id', user.id);
      
      if (error) throw error;
      alert("Configurações salvas! Suas vendas agora serão processadas com 1% de taxa de plataforma.");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Professor */}
      <div className="w-full lg:w-80 bg-slate-950 text-white shrink-0 p-8 flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
             <Zap size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black italic tracking-tighter text-white">PROFESSOR HUB</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Conta do Instrutor</p>
          </div>
        </div>

        <nav className="space-y-3">
          <SidebarBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={18} />} label="Resultados" />
          <SidebarBtn active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} icon={<BookOpen size={18} />} label="Meus Cursos" />
          <SidebarBtn active={activeTab === 'marketplace'} onClick={() => setActiveTab('marketplace')} icon={<CreditCard size={18} />} label="Pagamentos" />
        </nav>

        <div className="mt-auto">
          <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 space-y-3">
             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Taxa de Marketplace</p>
             <div className="flex items-center gap-2">
                <span className="text-2xl font-black italic">1.0%</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase leading-tight">Retidos pela plataforma</span>
             </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-grow p-8 lg:p-12 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-fade-in">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Minha Performance</h1>
                <p className="text-slate-500 font-medium text-sm">Acompanhe seus lucros (já descontados os 1% da plataforma).</p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard label="Receita Bruta" value={`R$ ${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign className="text-indigo-500" />} trend="Total vendido" />
              <StatCard label="Líquido Estimado" value={`R$ ${(stats.totalRevenue * 0.99).toLocaleString()}`} icon={<TrendingUp className="text-emerald-500" />} trend="Após taxa de 1%" />
              <StatCard label="Total Alunos" value={stats.totalStudents.toString()} icon={<Users className="text-sky-500" />} trend="Estudantes ativos" />
            </div>

            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
               <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700">
                  <Info size={20} />
                  <p className="text-xs font-bold uppercase tracking-tight">O split de 1% é processado automaticamente no momento da aprovação pelo Mercado Pago.</p>
               </div>
               <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-slate-400 font-bold text-sm uppercase italic tracking-widest">Relatório Detalhado em Breve</p>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="max-w-3xl animate-fade-in space-y-8">
            <header>
              <h1 className="text-3xl font-black text-slate-900 italic uppercase">Configurar Recebimento</h1>
              <p className="text-slate-500 font-medium">As vendas dos seus cursos cairão diretamente na sua conta Mercado Pago.</p>
            </header>

            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
               <div className="flex items-center gap-4 p-6 bg-slate-900 text-white rounded-[32px]">
                  <img src="https://logodownload.org/wp-content/uploads/2018/10/mercado-pago-logo-1.png" className="h-6 brightness-0 invert" alt="MP" />
                  <div className="h-8 w-[1px] bg-white/20"></div>
                  <p className="text-xs font-bold uppercase tracking-widest">Modo Marketplace Ativo</p>
               </div>

               <div className="space-y-6">
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Public Key do Professor</label>
                      <input 
                        type="text" 
                        value={paymentConfig.mercadopagoPublicKey} 
                        onChange={e => setPaymentConfig({...paymentConfig, mercadopagoPublicKey: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs focus:ring-4 focus:ring-indigo-50 outline-none" 
                        placeholder="APP_USR-..." 
                      />
                  </div>
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Access Token do Professor</label>
                      <input 
                        type="password" 
                        value={paymentConfig.mercadopagoAccessToken} 
                        onChange={e => setPaymentConfig({...paymentConfig, mercadopagoAccessToken: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs focus:ring-4 focus:ring-indigo-50 outline-none" 
                        placeholder="APP_USR-..." 
                      />
                      <p className="mt-2 text-[9px] text-slate-400 font-bold uppercase">Obtenha suas chaves em: Painel Mercado Pago &gt; Suas integrações</p>
                  </div>
               </div>

               <button 
                 onClick={handleSavePaymentConfig}
                 disabled={isSaving}
                 className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
               >
                  {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar Credenciais e Ativar Vendas</>}
               </button>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
           <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-black text-slate-900 italic uppercase">Meus Treinamentos</h1>
                 <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all">
                   <Plus size={18} /> Novo Curso
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                    <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-xs">Você ainda não criou nenhum curso.</p>
                  </div>
                ) : (
                  courses.map(course => (
                    <div key={course.id} className="bg-white rounded-[40px] border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all">
                       <div className="aspect-video relative overflow-hidden">
                          <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={course.title} />
                          <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase">Online</div>
                       </div>
                       <div className="p-8">
                          <h3 className="font-black text-slate-900 text-xl line-clamp-1 mb-4">{course.title}</h3>
                          <div className="flex justify-between items-center">
                             <div className="text-2xl font-black text-indigo-600 tracking-tighter">R$ {course.price?.toFixed(2)}</div>
                             <div className="text-[10px] font-black text-slate-400 uppercase">{course.students || 0} alunos</div>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
