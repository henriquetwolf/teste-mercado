
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  DollarSign, 
  ShieldCheck, 
  Globe,
  Loader2,
  TrendingUp,
  CreditCard,
  Zap,
  ArrowUpRight,
  UserCheck,
  Briefcase,
  Mail,
  Search,
  Settings,
  History,
  Save,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Percent
} from 'lucide-react';

const GlobalStat = ({ label, value, icon }: any) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm group hover:bg-indigo-600 hover:border-indigo-600 transition-all duration-500">
     <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-white/20 shadow-sm flex items-center justify-center text-slate-900 group-hover:text-white transition-all">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white/60 transition-colors">{label}</span>
     </div>
     <div className="text-3xl font-black tracking-tighter italic uppercase group-hover:text-white transition-colors">{value}</div>
  </div>
);

const MiniStat = ({ label, value, icon }: any) => (
  <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-600/20">
     <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
     </div>
     <div className="text-3xl font-black tracking-tighter italic uppercase">{value}</div>
  </div>
);

const StatusLine = ({ label, status }: any) => (
  <div className="flex justify-between items-center text-[10px] font-bold">
     <span className="text-slate-500 uppercase tracking-widest">{label}</span>
     <span className="text-indigo-400">{status}</span>
  </div>
);

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'sales' | 'settings'>('stats');
  const [stats, setStats] = useState({ revenue: 0, users: 0, courses: 0, sales: 0, platformFee: 0, commissionRate: 1 });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [salesList, setSalesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [mpConfig, setMpConfig] = useState({
    publicKey: '',
    accessToken: '',
    commissionRate: 1
  });

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    if (!refreshing) setLoading(true);
    try {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
      const { data: salesData } = await supabase.from('sales').select('amount, status').eq('status', 'Pago');
      
      const { data: config } = await supabase.from('platform_settings').select('value').eq('key', 'mercadopago_config').maybeSingle();
      const currentRate = config?.value?.commissionRate ?? 1;

      const totalRevenue = salesData?.reduce((acc, s) => acc + s.amount, 0) || 0;
      const totalPlatformFee = totalRevenue * (currentRate / 100);

      setStats({
        revenue: totalRevenue,
        users: usersCount || 0,
        courses: coursesCount || 0,
        sales: salesData?.length || 0,
        platformFee: totalPlatformFee,
        commissionRate: currentRate
      });

      if (config?.value) {
        setMpConfig({
          publicKey: config.value.publicKey || '',
          accessToken: config.value.accessToken || '',
          commissionRate: currentRate
        });
      }

      const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (users) setUsersList(users);

      const { data: salesHistory, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          course:courses(title),
          user:profiles(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (salesError) {
        const { data: simpleSales } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
        if (simpleSales) setSalesList(simpleSales);
      } else if (salesHistory) {
        setSalesList(salesHistory);
      }

    } catch (err) {
      console.error("Erro ao carregar dados admin:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({ 
          key: 'mercadopago_config', 
          value: mpConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      
      if (error) throw error;
      alert("Configuração Master salva!");
      loadAllData();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = usersList.filter(u => 
    (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSales = salesList.filter(s => {
    const term = searchTerm.toLowerCase();
    const courseTitle = s.course?.title?.toLowerCase() || '';
    const userName = s.user?.full_name?.toLowerCase() || '';
    const saleId = s.id?.toString() || '';
    return courseTitle.includes(term) || userName.includes(term) || saleId.includes(term);
  });

  if (loading && activeTab === 'stats') {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-950 text-white p-12 lg:p-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-12 relative z-10">
           <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 mx-auto lg:mx-0">
                 <ShieldCheck size={16} /> MASTER COORDINATOR
              </div>
              <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter uppercase leading-none">
                Ecossistema<br/>EduVantage
              </h1>
              <div className="flex bg-white/10 p-1 rounded-2xl w-fit mx-auto lg:mx-0 border border-white/10 overflow-x-auto max-w-full no-scrollbar">
                <button onClick={() => setActiveTab('stats')} className={`whitespace-nowrap px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-white text-slate-950 shadow-xl' : 'text-white/50 hover:text-white'}`}>Métricas</button>
                <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-slate-950 shadow-xl' : 'text-white/50 hover:text-white'}`}>Usuários</button>
                <button onClick={() => setActiveTab('sales')} className={`whitespace-nowrap px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sales' ? 'bg-white text-slate-950 shadow-xl' : 'text-white/50 hover:text-white'}`}>Vendas</button>
                <button onClick={() => setActiveTab('settings')} className={`whitespace-nowrap px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white text-slate-950 shadow-xl' : 'text-white/50 hover:text-white'}`}>Ajustes</button>
              </div>
           </div>
           <div className="flex gap-6">
              <div className="bg-white/5 border border-white/10 p-10 rounded-[48px] backdrop-blur-xl group hover:bg-white/10 transition-all text-center">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Comissões Coletadas ({stats.commissionRate}%)</p>
                 <div className="flex items-center gap-4">
                    <h2 className="text-5xl font-black tracking-tighter italic">R$ {stats.platformFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                    <div className="bg-emerald-500/20 text-emerald-500 p-2 rounded-full"><ArrowUpRight size={24} /></div>
                 </div>
              </div>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-12 -mt-16 relative z-20 pb-20">
         {activeTab === 'stats' && (
           <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MiniStat label="Transacionado" value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<DollarSign size={18} />} />
                <GlobalStat label="Alunos" value={stats.users.toString()} icon={<Users size={20} />} />
                <GlobalStat label="Cursos" value={stats.courses.toString()} icon={<BookOpen size={20} />} />
                <GlobalStat label="Taxa Atual" value={`${stats.commissionRate}%`} icon={<Percent size={20} />} />
            </div>
            {/* Rest of Stats UI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-16">
                <div className="lg:col-span-2 space-y-12">
                   <section className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-4">
                           <TrendingUp className="text-indigo-600" /> Fluxo de Comissões
                        </h3>
                        <button onClick={() => { setRefreshing(true); loadAllData(); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                        </button>
                      </div>
                      <div className="aspect-video bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 flex items-center justify-center">
                         <div className="text-center space-y-4">
                            <Zap size={40} className="mx-auto text-slate-200" />
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Relatório de Marketplace Dinâmico</p>
                         </div>
                      </div>
                   </section>
                </div>
                <aside className="space-y-8">
                   <div className="bg-slate-900 text-white p-12 rounded-[48px] shadow-2xl relative overflow-hidden group">
                      <div className="relative z-10 space-y-8">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><CreditCard size={20} /></div>
                            <h4 className="text-sm font-black uppercase tracking-widest">Gateway Monitor</h4>
                         </div>
                         <div className="space-y-6">
                            <StatusLine label="Split Engine" status="ACTIVE" />
                            <StatusLine label="Platform Fee" status={`${stats.commissionRate}% DYNAMIC`} />
                         </div>
                      </div>
                   </div>
                </aside>
            </div>
           </div>
         )}

         {/* Rest of Admin Tabs */}
         {activeTab === 'users' && (
           <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><Users size={20} className="text-slate-900" /></div>
                   <h3 className="text-xl font-black uppercase italic tracking-tighter">Usuários</h3>
                </div>
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-80 pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-50 outline-none" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Usuário</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Perfil</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Cadastro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-50">
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-900">{user.full_name || 'Usuário'}</p>
                          <p className="text-[10px] font-bold text-slate-400">{user.id}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest">{user.role}</span>
                        </td>
                        <td className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase">{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
         )}

         {activeTab === 'sales' && (
           <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Histórico de Vendas</h3>
                <div className="flex items-center gap-4">
                   <button onClick={() => { setRefreshing(true); loadAllData(); }} className="p-3 bg-slate-50 rounded-2xl"><RefreshCw size={18} className={refreshing ? "animate-spin" : ""} /></button>
                   <input type="text" placeholder="Filtrar vendas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none w-64" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Aluno/Curso</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Valor</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Status</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                           <p className="text-sm font-black text-slate-900">{sale.user?.full_name || 'Aluno #' + sale.user_id?.slice(0,5)}</p>
                           <p className="text-[10px] font-bold text-indigo-600 uppercase italic">{sale.course?.title || 'Curso #' + sale.course_id?.slice(0,5)}</p>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-sm font-black text-slate-900">R$ {Number(sale.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">Fee: R$ {(Number(sale.amount) * (stats.commissionRate / 100)).toFixed(2)}</p>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${sale.status === 'Pago' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>{sale.status || 'Pendente'}</span>
                        </td>
                        <td className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase">{new Date(sale.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
         )}

         {activeTab === 'settings' && (
           <div className="max-w-3xl mx-auto animate-fade-in space-y-12">
              <section className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-xl space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-2xl"><Settings size={28} /></div>
                    <div>
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter">Configuração Master Gateway</h3>
                       <p className="text-slate-500 text-sm font-medium">Define as credenciais globais para recebimento de taxas.</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-8">
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                        <label className="text-[10px] font-black uppercase text-indigo-600 mb-2 block tracking-widest">Participação da Plataforma (%)</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="number" 
                            step="0.1"
                            value={mpConfig.commissionRate} 
                            onChange={(e) => setMpConfig({ ...mpConfig, commissionRate: parseFloat(e.target.value) || 0 })} 
                            className="w-32 bg-white border border-indigo-200 rounded-2xl py-4 px-4 font-black text-xl text-indigo-600 outline-none" 
                          />
                          <div className="text-slate-400 font-bold text-xs">
                             Esta porcentagem será descontada automaticamente em cada venda realizada na plataforma.
                          </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Public Key Master (MP)</label>
                        <input type="text" value={mpConfig.publicKey} onChange={(e) => setMpConfig({ ...mpConfig, publicKey: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 font-mono text-xs outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Access Token Master (MP)</label>
                        <input type="password" value={mpConfig.accessToken} onChange={(e) => setMpConfig({ ...mpConfig, accessToken: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 font-mono text-xs outline-none" />
                        <p className="mt-2 text-[9px] text-slate-400 font-bold uppercase">Token de Produção disponível em: Painel de Desenvolvedor &gt; Minhas Aplicações.</p>
                    </div>
                 </div>
                 <button onClick={handleSaveConfig} disabled={isSaving} className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                    {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar Configurações Master</>}
                 </button>
              </section>
           </div>
         )}
      </div>
    </div>
  );
}
