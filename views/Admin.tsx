
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
  Search
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'stats' | 'users'>('stats');
  const [stats, setStats] = useState({ revenue: 0, users: 0, courses: 0, sales: 0, platformFee: 0 });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadGlobalStats();
    loadUsers();
  }, []);

  async function loadGlobalStats() {
    try {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
      const { data: salesData } = await supabase.from('sales').select('amount').eq('status', 'Pago');
      
      const totalRevenue = salesData?.reduce((acc, s) => acc + s.amount, 0) || 0;
      const totalPlatformFee = totalRevenue * 0.01;

      setStats({
        revenue: totalRevenue,
        users: usersCount || 0,
        courses: coursesCount || 0,
        sales: salesData?.length || 0,
        platformFee: totalPlatformFee
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setUsersList(data);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = usersList.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && activeTab === 'stats') return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Master Admin */}
      <div className="bg-slate-950 text-white p-12 lg:p-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-12 relative z-10">
           <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 mx-auto lg:mx-0">
                 <ShieldCheck size={16} /> MASTER COORDINATOR
              </div>
              <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter uppercase leading-none">
                Ecossistema<br/>EduVantage
              </h1>
              <div className="flex bg-white/10 p-1 rounded-2xl w-fit mx-auto lg:mx-0 border border-white/10">
                <button onClick={() => setActiveTab('stats')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-white text-slate-950 shadow-xl' : 'text-white/50 hover:text-white'}`}>Métricas</button>
                <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-slate-950 shadow-xl' : 'text-white/50 hover:text-white'}`}>Usuários</button>
              </div>
           </div>
           
           <div className="flex gap-6">
              <div className="bg-white/5 border border-white/10 p-10 rounded-[48px] backdrop-blur-xl group hover:bg-white/10 transition-all">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Comissões Coletadas (1%)</p>
                 <div className="flex items-center gap-4">
                    <h2 className="text-5xl font-black tracking-tighter italic">R$ {stats.platformFee.toLocaleString()}</h2>
                    <div className="bg-emerald-500/20 text-emerald-500 p-2 rounded-full"><ArrowUpRight size={24} /></div>
                 </div>
              </div>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-12 -mt-16 relative z-20 pb-20">
         {activeTab === 'stats' ? (
           <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MiniStat label="Transacionado" value={`R$ ${stats.revenue.toLocaleString()}`} icon={<DollarSign size={18} />} />
                <GlobalStat label="Alunos" value={stats.users.toString()} icon={<Users size={20} />} />
                <GlobalStat label="Cursos" value={stats.courses.toString()} icon={<BookOpen size={20} />} />
                <GlobalStat label="Uptime" value="99.9%" icon={<Globe size={20} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-16">
                <div className="lg:col-span-2 space-y-12">
                   <section className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm">
                      <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase italic tracking-tighter flex items-center gap-4">
                         <TrendingUp className="text-indigo-600" /> Fluxo de Comissões
                      </h3>
                      <div className="aspect-video bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 flex items-center justify-center">
                         <div className="text-center space-y-4">
                            <Zap size={40} className="mx-auto text-slate-200" />
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Relatório de Marketplace Dinâmico v2.0</p>
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
                            <StatusLine label="Teacher Payouts" status="INSTANT" />
                            <StatusLine label="Platform Fee" status="1.0% FIXED" />
                         </div>
                         <button className="w-full bg-white/10 hover:bg-white text-slate-400 hover:text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase transition-all tracking-widest border border-white/5">
                            Relatório de Taxas
                         </button>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 opacity-[0.05] rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                   </div>
                </aside>
            </div>
           </>
         ) : (
           <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><Users size={20} className="text-slate-900" /></div>
                   <h3 className="text-xl font-black uppercase italic tracking-tighter">Gerenciamento de Usuários</h3>
                </div>
                <div className="relative w-full md:w-96">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                      type="text" 
                      placeholder="Buscar por nome ou ID..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                   />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Supabase</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cadastro em</th>
                      <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-20 text-center">
                           <Loader2 className="animate-spin mx-auto text-slate-200 mb-4" size={32} />
                           <p className="text-slate-400 font-bold uppercase text-xs">Nenhum usuário encontrado...</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 text-xs">
                                {user.full_name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{user.full_name || 'Sem Nome'}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{user.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              user.role === 'instructor' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-sky-50 border-sky-100 text-sky-600'
                            }`}>
                              {user.role === 'instructor' ? <Briefcase size={12} /> : <UserCheck size={12} />}
                              {user.role === 'instructor' ? 'Professor' : 'Aluno'}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-xs font-mono text-slate-400">{user.id}</td>
                          <td className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Mail size={16} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
           </div>
         )}
      </div>
    </div>
  );
}

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
