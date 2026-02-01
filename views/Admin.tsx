
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
  Search,
  ShoppingCart,
  AlertCircle,
  // Added GraduationCap import to fix "Cannot find name 'GraduationCap'" error
  GraduationCap
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'sales' | 'courses'>('dashboard');
  const [activeSalesSubTab, setActiveSalesSubTab] = useState<'api' | 'local'>('local');
  const [mpConfig, setMpConfig] = useState({ publicKey: '', accessToken: '', mode: 'production' });
  const [mpSales, setMpSales] = useState<any[]>([]);
  const [localSales, setLocalSales] = useState<any[]>([]);
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

      // Vendas Locais (Supabase) - Incluindo intenções
      const { data: localSalesData } = await supabase
        .from('sales')
        .select('*, courses(title)')
        .order('created_at', { ascending: false });
      if (localSalesData) setLocalSales(localSalesData);

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
      const { data: localSalesData } = await supabase.from('sales').select('*, courses(title)').order('created_at', { ascending: false });
      if (localSalesData) setLocalSales(localSalesData);
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
      alert("Configurações salvas!");
      await fetchData();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Cálculos
  const totalApproved = mpSales
    .filter(s => s.status === 'approved')
    .reduce((acc, s) => acc + (s.transaction_amount || 0), 0);

  const localPendingCount = localSales.filter(s => s.status === 'Iniciado' || s.status === 'Pendente').length;

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
          <NavItem active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={<CreditCard size={20}/>} label="Vendas & Leads" />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Wallet size={20}/>} label="Configurar API" />
        </nav>
      </div>

      <div className="flex-grow flex flex-col min-w-0">
        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="animate-spin text-sky-500" size={48} />
          </div>
        ) : (
          <main className="p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            <header className="mb-12 flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">
                  {activeTab === 'dashboard' ? 'Performance' : 
                   activeTab === 'courses' ? 'Treinamentos' :
                   activeTab === 'sales' ? 'Gestão de Vendas' : 'Conexão MP'}
                </h1>
                <p className="text-slate-500 font-medium">Controle total da sua operação digital.</p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={refreshPayments} 
                  disabled={isRefreshing}
                  className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                  Atualizar Dados
                </button>
              </div>
            </header>

            {activeTab === 'dashboard' && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <StatCard 
                    label="Faturamento (MP)" 
                    value={`R$ ${totalApproved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    subtext="Valores confirmados no gateway"
                    icon={<DollarSign className="text-emerald-500" />}
                    color="bg-emerald-500"
                  />
                  <StatCard 
                    label="Checkouts Iniciados" 
                    value={localPendingCount.toString()}
                    subtext="Potenciais clientes (leads)"
                    icon={<ShoppingCart className="text-amber-500" />}
                    color="bg-amber-500"
                  />
                  <StatCard 
                    label="Conversão Estimada" 
                    value={`${localSales.length > 0 ? ((mpSales.filter(s => s.status === 'approved').length / localSales.length) * 100).toFixed(1) : 0}%`}
                    subtext="Cliques vs Pagos"
                    icon={<ArrowUpRight className="text-sky-500" />}
                    color="bg-sky-500"
                  />
                </div>

                <div className="bg-white rounded-[40px] border border-slate-200 p-10">
                   <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                     <AlertCircle className="text-amber-500" /> Últimas Intenções de Compra
                   </h3>
                   <div className="space-y-4">
                     {localSales.slice(0, 5).map(sale => (
                       <div key={sale.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${sale.status === 'Pago' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                               <ShoppingCart size={20} />
                             </div>
                             <div>
                               <p className="text-sm font-black text-slate-900">ID: {sale.user_id.slice(0,8)}... no curso {sale.courses?.title}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(sale.created_at).toLocaleString()}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-slate-900">R$ {sale.amount?.toFixed(2)}</p>
                             <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${sale.status === 'Pago' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                               {sale.status === 'Iniciado' ? 'ABANDONOU/PENDENTE' : sale.status}
                             </span>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="space-y-6">
                <div className="flex bg-white p-2 rounded-2xl border border-slate-200 w-fit">
                   <button 
                     onClick={() => setActiveSalesSubTab('local')}
                     className={`px-6 py-3 rounded-xl font-bold text-xs transition-all ${activeSalesSubTab === 'local' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     Intenções & Leads (Sistema)
                   </button>
                   <button 
                     onClick={() => setActiveSalesSubTab('api')}
                     className={`px-6 py-3 rounded-xl font-bold text-xs transition-all ${activeSalesSubTab === 'api' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     Extrato Real (Mercado Pago API)
                   </button>
                </div>

                {activeSalesSubTab === 'local' ? (
                  <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <tr>
                            <th className="px-8 py-6">Data / Lead</th>
                            <th className="px-8 py-6">Curso Pretendido</th>
                            <th className="px-8 py-6">Valor</th>
                            <th className="px-8 py-6">Situação</th>
                            <th className="px-8 py-6">Ref. MP</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {localSales.map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="text-xs font-bold text-slate-900">Usuário: {sale.user_id.slice(0,8)}</div>
                                  <div className="text-[10px] text-slate-400">{new Date(sale.created_at).toLocaleString()}</div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="text-xs font-bold text-slate-600">{sale.courses?.title || 'Curso não identificado'}</div>
                               </td>
                               <td className="px-8 py-6">
                                  <span className="text-sm font-black text-slate-900">R$ {sale.amount?.toFixed(2)}</span>
                               </td>
                               <td className="px-8 py-6">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${sale.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                     {sale.status === 'Iniciado' ? 'CHECKOUT ABANDONADO' : sale.status}
                                  </span>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="text-[10px] font-mono text-slate-400 truncate max-w-[100px]">{sale.mp_preference_id || '-'}</div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm animate-fade-in">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <tr>
                            <th className="px-8 py-6">Pagamento / Data</th>
                            <th className="px-8 py-6">Pagador</th>
                            <th className="px-8 py-6">Valor</th>
                            <th className="px-8 py-6">Status MP</th>
                            <th className="px-8 py-6 text-right">Ação</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {mpSales.map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="text-xs font-bold text-slate-900">#{sale.id}</div>
                                  <div className="text-[10px] text-slate-400">{new Date(sale.date_created).toLocaleString()}</div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="text-xs font-bold text-slate-600">{sale.payer?.email}</div>
                               </td>
                               <td className="px-8 py-6">
                                  <span className="text-sm font-black text-slate-900">R$ {sale.transaction_amount?.toFixed(2)}</span>
                               </td>
                               <td className="px-8 py-6">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${getStatusColor(sale.status)}`}>
                                     {sale.status}
                                  </span>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <a href={`https://www.mercadopago.com.br/money-out/transfer/receipt/${sale.id}`} target="_blank" rel="noreferrer" className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-sky-600 hover:text-white transition-all inline-block">
                                    <ExternalLink size={16} />
                                  </a>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <form onSubmit={saveSettings} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center">
                        <Key size={24} />
                     </div>
                     <h2 className="text-xl font-black text-slate-900 tracking-tight">Credenciais da API</h2>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Public Key</label>
                      <input value={mpConfig.publicKey} onChange={e => setMpConfig({...mpConfig, publicKey: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Access Token</label>
                      <input type="password" value={mpConfig.accessToken} onChange={e => setMpConfig({...mpConfig, accessToken: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full bg-sky-600 text-white py-5 rounded-2xl font-black hover:bg-sky-700 transition-all">
                     {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar Configurações'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'courses' && (
              editingCourse ? (
                <form onSubmit={saveCourse} className="bg-white p-12 rounded-[40px] border shadow-sm space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Título do Curso</label>
                        <input required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Preço (R$)</label>
                        <input type="number" step="0.01" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: parseFloat(e.target.value)})} className="w-full p-4 bg-sky-50 border-2 border-sky-100 rounded-2xl font-black text-sky-600 text-2xl" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">URL da Thumbnail</label>
                      <input value={courseForm.thumbnail} onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setEditingCourse(null)} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="flex-[2] bg-sky-600 text-white py-5 rounded-2xl font-black hover:bg-sky-700">Salvar Alterações</button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map(course => (
                    <div key={course.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden group flex flex-col">
                      <div className="aspect-video relative overflow-hidden">
                        <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-8 flex-grow flex flex-col">
                        <h3 className="font-black text-slate-900 mb-6 text-xl line-clamp-2">{course.title}</h3>
                        <div className="flex justify-between items-center pt-6 border-t mt-auto">
                          <button onClick={() => { setEditingCourse(course); setCourseForm({...course}); }} className="p-3 bg-slate-50 text-slate-400 hover:bg-sky-600 hover:text-white rounded-xl transition-all"><Edit3 size={18}/></button>
                          <span className="text-[10px] font-black text-sky-600 uppercase">R$ {course.price.toFixed(2)}</span>
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
  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 mb-2">{value}</h4>
      <p className="text-[10px] font-bold text-slate-400 uppercase opacity-70">{subtext}</p>
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
