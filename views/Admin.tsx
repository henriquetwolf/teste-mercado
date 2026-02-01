
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { searchPayments } from '../services/mercadoPago';
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
  Wallet,
  ExternalLink,
  CheckCircle2,
  Info,
  RefreshCcw,
  ArrowUpRight,
  Clock,
  User as UserIcon,
  Search
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'sales' | 'courses'>('dashboard');
  const [mpConfig, setMpConfig] = useState({ publicKey: '', accessToken: '', mode: 'production' });
  const [mpSales, setMpSales] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    instructor: '',
    price: 0,
    thumbnail: '',
    description: '',
    modules: [] as any[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Configurações
      const { data: configData } = await supabase.from('platform_settings').select('value').eq('key', 'mercadopago_config').maybeSingle();
      if (configData) setMpConfig(configData.value);

      // Cursos
      const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (coursesData) setCourses(coursesData);

      // Vendas Reais do Mercado Pago
      if (configData?.value?.accessToken) {
        const sales = await searchPayments(30);
        setMpSales(sales);
      }
    } catch (err) {
      console.error("Erro ao carregar dados admin:", err);
    }
    setLoading(false);
  }

  const refreshPayments = async () => {
    setIsRefreshing(true);
    try {
      const sales = await searchPayments(30);
      setMpSales(sales);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        id: editingCourse?.id || undefined,
        title: courseForm.title,
        instructor: courseForm.instructor,
        price: courseForm.price,
        thumbnail: courseForm.thumbnail,
        description: courseForm.description,
        modules: courseForm.modules,
        rating: 5.0
      };

      const { error } = await supabase.from('courses').upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      alert("Curso salvo com sucesso!");
      setEditingCourse(null);
      await fetchData();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('platform_settings').upsert({ key: 'mercadopago_config', value: mpConfig }, { onConflict: 'key' });
      if (error) throw error;
      alert("Configurações salvas! Clique em atualizar nas vendas para testar.");
      await fetchData();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Cálculos do Dashboard
  const totalApproved = mpSales
    .filter(s => s.status === 'approved')
    .reduce((acc, s) => acc + (s.transaction_amount || 0), 0);

  const pendingCount = mpSales.filter(s => s.status === 'pending' || s.status === 'in_process').length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 text-white hidden lg:flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-800 font-black text-2xl flex items-center gap-3 italic">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white not-italic shadow-lg shadow-sky-500/20">
            <GraduationCap size={24} />
          </div>
          EduAdmin
        </div>
        <nav className="p-6 space-y-2 flex-grow">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 size={20}/>} label="Dashboard" />
          <NavItem active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} icon={<BookOpen size={20}/>} label="Gerenciar Cursos" />
          <NavItem active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={<CreditCard size={20}/>} label="Extrato de Vendas" />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Wallet size={20}/>} label="Configurar API" />
        </nav>
        <div className="p-6 border-t border-slate-800">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold">W</div>
            <div>
              <p className="text-xs font-bold text-white">Wolf Admin</p>
              <p className="text-[10px] text-slate-500">Acesso mestre</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col min-w-0">
        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="animate-spin text-sky-500 mb-4 mx-auto" size={48} />
              <p className="text-slate-400 font-medium">Sincronizando com Mercado Pago...</p>
            </div>
          </div>
        ) : (
          <main className="p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            <header className="mb-12 flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                  {activeTab === 'dashboard' ? 'Métricas da Plataforma' : 
                   activeTab === 'courses' ? 'Catálogo de Treinamentos' :
                   activeTab === 'sales' ? 'Extrato Mercado Pago' : 'Configurações de Gateway'}
                </h1>
                <p className="text-slate-500 font-medium">Gestão centralizada de vendas e conteúdos.</p>
              </div>
              
              <div className="flex gap-3">
                {activeTab === 'sales' && (
                  <button 
                    onClick={refreshPayments} 
                    disabled={isRefreshing}
                    className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                  >
                    <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    Sincronizar API
                  </button>
                )}
                {activeTab === 'courses' && !editingCourse && (
                  <button onClick={() => {
                     setEditingCourse({ id: null });
                     setCourseForm({ title: '', instructor: '', price: 0, thumbnail: '', description: '', modules: [] });
                  }} className="bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all active:scale-95">
                    <Plus size={20} /> Novo Curso
                  </button>
                )}
              </div>
            </header>

            {activeTab === 'dashboard' && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <StatCard 
                    label="Faturamento Total" 
                    value={`R$ ${totalApproved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    subtext="Somente pagamentos aprovados"
                    icon={<DollarSign className="text-emerald-500" />}
                    color="bg-emerald-500"
                  />
                  <StatCard 
                    label="Vendas Pendentes" 
                    value={pendingCount.toString()}
                    subtext="Aguardando confirmação"
                    icon={<Clock className="text-amber-500" />}
                    color="bg-amber-500"
                  />
                  <StatCard 
                    label="Total de Registros" 
                    value={mpSales.length.toString()}
                    subtext="Últimos 30 dias de histórico"
                    icon={<Search className="text-sky-500" />}
                    color="bg-sky-500"
                  />
                </div>

                <div className="bg-white rounded-[40px] border border-slate-200 p-10">
                   <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                     <ArrowUpRight className="text-sky-500" /> Atividade Recente
                   </h3>
                   <div className="space-y-4">
                     {mpSales.slice(0, 5).map(sale => (
                       <div key={sale.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-sky-200 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-sky-600 transition-colors">
                               <UserIcon size={18} />
                             </div>
                             <div>
                               <p className="text-sm font-bold text-slate-900">{sale.payer?.email || 'Comprador'}</p>
                               <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{new Date(sale.date_created).toLocaleString()}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-slate-900">R$ {sale.transaction_amount?.toFixed(2)}</p>
                             <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${getStatusColor(sale.status)}`}>
                               {sale.status}
                             </span>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <tr>
                            <th className="px-8 py-6">Pagamento / Data</th>
                            <th className="px-8 py-6">Pagador</th>
                            <th className="px-8 py-6">Valor</th>
                            <th className="px-8 py-6">Status</th>
                            <th className="px-8 py-6">Método</th>
                            <th className="px-8 py-6 text-right">Ação</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {mpSales.map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                               <td className="px-8 py-6">
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                    #{sale.id}
                                    {sale.status === 'approved' && <CheckCircle2 size={12} className="text-emerald-500" />}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium">{new Date(sale.date_created).toLocaleString()}</div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="text-xs font-bold text-slate-600 max-w-[150px] truncate">{sale.payer?.email}</div>
                               </td>
                               <td className="px-8 py-6">
                                  <span className="text-sm font-black text-slate-900">R$ {sale.transaction_amount?.toFixed(2)}</span>
                               </td>
                               <td className="px-8 py-6">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${getStatusColor(sale.status)}`}>
                                     {sale.status}
                                  </span>
                               </td>
                               <td className="px-8 py-6">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">{sale.payment_method_id}</span>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <a 
                                    href={`https://www.mercadopago.com.br/money-out/transfer/receipt/${sale.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-sky-50 hover:text-sky-600 transition-all inline-block"
                                    title="Ver no Mercado Pago"
                                  >
                                    <ExternalLink size={16} />
                                  </a>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                 </div>
                 {mpSales.length === 0 && (
                   <div className="p-20 text-center">
                      <CreditCard className="mx-auto text-slate-200 mb-4" size={48} />
                      <p className="text-slate-400 font-medium">Nenhum pagamento encontrado na API.</p>
                   </div>
                 )}
              </div>
            )}

            {/* Reusing existing Tabs logic for Courses and Settings... */}
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                <form onSubmit={saveSettings} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center">
                        <Key size={24} />
                     </div>
                     <h2 className="text-xl font-black text-slate-900 tracking-tight">Credenciais da API</h2>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1 tracking-widest">Public Key</label>
                      <input value={mpConfig.publicKey} onChange={e => setMpConfig({...mpConfig, publicKey: e.target.value})} placeholder="APP_USR-..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs focus:ring-4 focus:ring-sky-50 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1 tracking-widest">Access Token (Privado)</label>
                      <input type="password" value={mpConfig.accessToken} onChange={e => setMpConfig({...mpConfig, accessToken: e.target.value})} placeholder="APP_USR-..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs focus:ring-4 focus:ring-sky-50 outline-none transition-all" />
                    </div>
                  </div>

                  <button type="submit" disabled={isSaving} className="w-full bg-sky-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 flex items-center justify-center gap-2 active:scale-[0.98]">
                     {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar Configurações</>}
                  </button>
                </form>

                <div className="bg-slate-900 text-white p-10 rounded-[40px] flex flex-col justify-center relative overflow-hidden">
                  <div className="z-10">
                    <h3 className="text-2xl font-black mb-4 flex items-center gap-2 text-sky-400">Integração Ativa</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-8 font-medium">
                      Suas credenciais permitem que o sistema monitore pagamentos em tempo real e libere cursos automaticamente. 
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-xs font-bold text-slate-300">
                        <CheckCircle2 size={16} className="text-emerald-400" /> Webhooks de notificação configurados
                      </li>
                      <li className="flex items-center gap-3 text-xs font-bold text-slate-300">
                        <CheckCircle2 size={16} className="text-emerald-400" /> Sincronização de checkout Pro
                      </li>
                    </ul>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl"></div>
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              editingCourse ? (
                <form onSubmit={saveCourse} className="space-y-8 bg-white p-12 rounded-[40px] border animate-fade-in shadow-sm relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Título do Curso</label>
                        <input required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sky-50 transition-all font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Preço Sugerido (R$)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-600" size={18} />
                          <input type="number" step="0.01" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: parseFloat(e.target.value)})} className="w-full p-4 pl-12 bg-sky-50 border-2 border-sky-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-100 transition-all font-black text-sky-600 text-2xl" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Nome do Instrutor</label>
                        <input value={courseForm.instructor} onChange={e => setCourseForm({...courseForm, instructor: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Preview da Capa</label>
                      <div className="aspect-video bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden relative group">
                        {courseForm.thumbnail ? (
                          <img src={courseForm.thumbnail} className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-300 flex-col gap-2">
                            <Plus size={32}/>
                            <span className="text-[10px] font-black uppercase">Insira uma URL de Imagem</span>
                          </div>
                        )}
                        <input 
                          placeholder="https://suaimagem.com/foto.jpg" 
                          value={courseForm.thumbnail}
                          onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})}
                          className="absolute bottom-6 left-6 right-6 p-4 bg-white/95 backdrop-blur rounded-2xl text-[11px] border shadow-2xl outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-8">
                    <button type="button" onClick={() => setEditingCourse(null)} className="flex-1 bg-slate-50 text-slate-400 py-5 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="flex-[2] bg-sky-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-sky-100 hover:bg-sky-700 transition-all active:scale-[0.98]">
                      {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Publicar Treinamento'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map(course => (
                    <div key={course.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500 group flex flex-col">
                      <div className="aspect-video relative overflow-hidden">
                        <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute top-4 right-4 bg-sky-600 px-4 py-1.5 rounded-full text-xs font-black text-white shadow-xl">
                          R$ {(course.price || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="p-8 flex-grow">
                        <h3 className="font-black text-slate-900 mb-6 text-xl line-clamp-2 leading-tight">{course.title}</h3>
                        <div className="flex justify-between items-center pt-6 border-t border-slate-50 mt-auto">
                          <div className="flex gap-2">
                            <button onClick={() => {
                              setEditingCourse(course);
                              setCourseForm({...course});
                            }} className="p-3 bg-slate-50 text-slate-400 hover:bg-sky-600 hover:text-white rounded-xl transition-all"><Edit3 size={18}/></button>
                            <button className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all"><Trash2 size={18}/></button>
                          </div>
                          <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                            <CheckCircle2 size={14}/> Ativo
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </main>
        )}
      </div>
    </div>
  );
}

// Subcomponentes
const NavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    {icon} {label}
  </button>
);

const StatCard = ({ label, value, subtext, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-sky-200 transition-all">
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 mb-2">{value}</h4>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter opacity-70">{subtext}</p>
    </div>
    <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-[0.03] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000`}></div>
  </div>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-emerald-100 text-emerald-700';
    case 'pending':
    case 'in_process': return 'bg-amber-100 text-amber-700';
    case 'rejected': return 'bg-rose-100 text-rose-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const GraduationCap = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
