
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
  ArrowUpRight
} from 'lucide-react';

export default function Admin() {
  const [stats, setStats] = useState({ revenue: 0, users: 0, courses: 0, sales: 0, platformFee: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGlobalStats();
  }, []);

  async function loadGlobalStats() {
    setLoading(true);
    try {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
      const { data: salesData } = await supabase.from('sales').select('amount').eq('status', 'Pago');
      
      const totalRevenue = salesData?.reduce((acc, s) => acc + s.amount, 0) || 0;
      const totalPlatformFee = totalRevenue * 0.01; // Sua comissão de 1%

      setStats({
        revenue: totalRevenue,
        users: usersCount || 0,
        courses: coursesCount || 0,
        sales: salesData?.length || 0,
        platformFee: totalPlatformFee
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Master Admin */}
      <div className="bg-slate-950 text-white p-12 lg:p-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-12 relative z-10">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                 <ShieldCheck size={16} /> MASTER COORDINATOR
              </div>
              <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter uppercase leading-none">
                Ecossistema<br/>EduVantage
              </h1>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.3em]">Gestão Global de Receitas & Split de Pagamentos</p>
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

      <div className="max-w-7xl mx-auto px-12 -mt-16 relative z-20">
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
