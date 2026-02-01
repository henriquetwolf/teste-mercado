
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
  Wallet,
  ExternalLink,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'sales' | 'courses'>('dashboard');
  const [mpConfig, setMpConfig] = useState({ publicKey: '', accessToken: '', mode: 'production' });
  const [sales, setSales] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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

      alert("Curso salvo! O sistema gerará o link de pagamento automaticamente no checkout.");
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
      alert("Configurações do Mercado Pago salvas!");
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="w-64 bg-slate-900 text-white hidden lg:flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-800 font-bold text-xl flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white"><Settings size={18} /></div>
          EduAdmin
        </div>
        <nav className="p-4 space-y-2 flex-grow">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-sky-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BarChart3 size={20} /> Métricas
          </button>
          <button onClick={() => setActiveTab('courses')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'courses' ? 'bg-sky-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BookOpen size={20} /> Cursos
          </button>
          <button onClick={() => setActiveTab('sales')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sales' ? 'bg-sky-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <CreditCard size={20} /> Vendas
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-sky-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Wallet size={20} /> Configurar API
          </button>
        </nav>
      </div>

      <div className="flex-grow p-8 overflow-y-auto">
        {loading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-sky-500" size={48} /></div> : (
          <>
            <header className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tight">{activeTab}</h1>
                <p className="text-slate-500">Gestão automática de pagamentos</p>
              </div>
              {activeTab === 'courses' && !editingCourse && (
                <button onClick={() => {
                   setEditingCourse({ id: null });
                   setCourseForm({ title: '', instructor: '', price: 0, thumbnail: '', description: '', modules: [] });
                }} className="bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-sky-700 shadow-lg transition-all active:scale-95">
                  <Plus size={20} /> Adicionar Curso
                </button>
              )}
            </header>

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <form onSubmit={saveSettings} className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center">
                        <Key size={24} />
                     </div>
                     <h2 className="text-xl font-black text-slate-900">Credenciais API</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1 tracking-widest">Public Key</label>
                      <input value={mpConfig.publicKey} onChange={e => setMpConfig({...mpConfig, publicKey: e.target.value})} placeholder="APP_USR-..." className="w-full p-4 bg-slate-50 border rounded-2xl font-mono text-xs focus:ring-4 focus:ring-sky-50 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1 tracking-widest">Access Token</label>
                      <input type="password" value={mpConfig.accessToken} onChange={e => setMpConfig({...mpConfig, accessToken: e.target.value})} placeholder="APP_USR-..." className="w-full p-4 bg-slate-50 border rounded-2xl font-mono text-xs focus:ring-4 focus:ring-sky-50 outline-none transition-all" />
                    </div>
                  </div>

                  <button type="submit" disabled={isSaving} className="w-full bg-sky-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 flex items-center justify-center gap-2">
                     {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Ativar Automação</>}
                  </button>
                </form>

                <div className="bg-slate-900 text-white p-10 rounded-[32px] flex flex-col justify-center">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-sky-400"><Info size={20}/> Como funciona?</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    Com o seu <strong>Access Token</strong> configurado, o sistema cria o pagamento dinamicamente para cada aluno. Você não precisa mais criar links manuais no site do Mercado Pago.
                  </p>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex items-start gap-4">
                    <ShieldCheck className="text-emerald-400 shrink-0" />
                    <div className="text-[11px] text-slate-300">
                      <strong>Dica:</strong> Use as credenciais de <strong>Produção</strong> para receber valores reais ou de <strong>Teste</strong> para validar o fluxo.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
               editingCourse ? (
                 <form onSubmit={saveCourse} className="space-y-8 bg-white p-10 rounded-[40px] border animate-fade-in shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-6">
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Título do Curso</label>
                            <input required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-4 focus:ring-sky-50 transition-all" />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Preço de Venda (R$)</label>
                            <div className="relative">
                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-600" size={18} />
                              <input type="number" step="0.01" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: parseFloat(e.target.value)})} className="w-full p-4 pl-12 bg-sky-50 border-2 border-sky-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-100 transition-all font-black text-sky-600 text-xl" />
                            </div>
                            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase">O Mercado Pago gerará o pagamento neste valor exato.</p>
                          </div>
                       </div>
                       <div className="space-y-6 text-center">
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Capa do Treinamento</label>
                          <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden relative group">
                            {courseForm.thumbnail ? (
                              <img src={courseForm.thumbnail} className="w-full h-full object-cover" />
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-300"><Plus size={32}/></div>
                            )}
                            <input 
                              placeholder="Cole URL da imagem aqui" 
                              value={courseForm.thumbnail}
                              onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})}
                              className="absolute bottom-4 left-4 right-4 p-3 bg-white/90 backdrop-blur rounded-xl text-[10px] border shadow-xl outline-none"
                            />
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-4 pt-6">
                       <button type="button" onClick={() => setEditingCourse(null)} className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-lg active:scale-95 transition-all">Cancelar</button>
                       <button type="submit" disabled={isSaving} className="flex-[2] bg-sky-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-sky-100 active:scale-95 transition-all">
                          {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar e Ativar Vendas'}
                       </button>
                    </div>
                 </form>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {courses.map(course => (
                     <div key={course.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500 group">
                        <div className="aspect-video relative overflow-hidden">
                          <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute top-4 right-4 bg-sky-600 px-3 py-1 rounded-full text-[10px] font-black text-white shadow-lg">
                            R$ {(course.price || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="p-8">
                           <h3 className="font-black text-slate-900 mb-6 text-lg line-clamp-1">{course.title}</h3>
                           <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                              <div className="flex gap-2">
                                <button onClick={() => {
                                  setEditingCourse(course);
                                  setCourseForm({...course});
                                }} className="p-3 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-xl transition-all"><Edit3 size={18}/></button>
                                <button className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"><Trash2 size={18}/></button>
                              </div>
                              <div className="flex items-center gap-1 text-emerald-500 font-black text-[9px] uppercase">
                                <CheckCircle2 size={14}/> Pronto para Venda
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               )
            )}
            
            {activeTab === 'sales' && (
              <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                       <tr>
                          <th className="px-8 py-6">ID / Data</th>
                          <th className="px-8 py-6">Valor</th>
                          <th className="px-8 py-6">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {sales.map(sale => (
                          <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-8 py-6">
                                <div className="text-xs font-bold text-slate-900">#{(sale.id || '').slice(0, 8)}</div>
                                <div className="text-[10px] text-slate-400">{new Date(sale.created_at).toLocaleDateString()}</div>
                             </td>
                             <td className="px-8 py-6">
                                <span className="text-sm font-black text-sky-600">R$ {(sale.amount || 0).toFixed(2)}</span>
                             </td>
                             <td className="px-8 py-6">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${sale.status === 'Pago' || sale.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                   {sale.status || 'Pendente'}
                                </span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            )}
            
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
                   <div className="relative z-10">
                      <div className="text-sky-400 text-[10px] font-black uppercase tracking-widest mb-2">Vendas Totais</div>
                      <div className="text-4xl font-black mb-4">R$ {sales.reduce((acc, s) => acc + (s.amount || 0), 0).toFixed(2)}</div>
                      <div className="text-xs text-slate-400">Processado via API Automática</div>
                   </div>
                   <CreditCard size={120} className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
