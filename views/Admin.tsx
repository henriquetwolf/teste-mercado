
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { searchPayments } from '../services/mercadoPago';
import { 
  Settings, 
  BarChart3, 
  CreditCard, 
  BookOpen, 
  DollarSign, 
  Loader2, 
  Edit3, 
  Key,
  Wallet,
  ExternalLink,
  RefreshCcw,
  ArrowUpRight,
  ShoppingCart,
  AlertCircle,
  GraduationCap,
  Tag,
  Plus,
  Trash2,
  X,
  Check
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'sales' | 'courses' | 'coupons'>('dashboard');
  const [activeSalesSubTab, setActiveSalesSubTab] = useState<'api' | 'local'>('local');
  const [mpConfig, setMpConfig] = useState({ publicKey: '', accessToken: '', mode: 'production' });
  const [mpSales, setMpSales] = useState<any[]>([]);
  const [localSales, setLocalSales] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
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

  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_percent: 10,
    active: true
  });
  const [showCouponModal, setShowCouponModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: configData } = await supabase.from('platform_settings').select('value').eq('key', 'mercadopago_config').maybeSingle();
      if (configData) setMpConfig(configData.value);

      const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (coursesData) setCourses(coursesData);

      const { data: couponsData } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (couponsData) setCoupons(couponsData);

      const { data: localSalesData } = await supabase
        .from('sales')
        .select('*, courses(title)')
        .order('created_at', { ascending: false });
      if (localSalesData) setLocalSales(localSalesData);

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
      
      const { data: couponsData } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (couponsData) setCoupons(couponsData);
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

  const saveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('coupons').upsert({
        code: couponForm.code.toUpperCase().trim(),
        discount_percent: couponForm.discount_percent,
        active: couponForm.active
      });
      if (error) throw error;
      alert("Cupom salvo!");
      setShowCouponModal(false);
      setCouponForm({ code: '', discount_percent: 10, active: true });
      await fetchData();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Excluir este cupom?")) return;
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(err.message);
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
          <NavItem active={activeTab === 'courses'} onClick={() => { setActiveTab('courses'); setEditingCourse(null); }} icon={<BookOpen size={20}/>} label="Gerenciar Cursos" />
          <NavItem active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} icon={<Tag size={20}/>} label="Cupons" />
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
                   activeTab === 'coupons' ? 'Promoções' :
                   activeTab === 'sales' ? 'Gestão de Vendas' : 'Conexão MP'}
                </h1>
                <p className="text-slate-500 font-medium">Controle total da sua operação digital.</p>
              </div>
              
              <div className="flex gap-3">
                {activeTab === 'courses' && !editingCourse && (
                  <button onClick={() => {
                     setEditingCourse({ id: null });
                     setCourseForm({ title: '', instructor: '', price: 0, thumbnail: '', description: '', modules: [] });
                  }} className="bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-sky-700 shadow-xl shadow-sky-200 transition-all active:scale-95">
                    <Plus size={20} /> Novo Curso
                  </button>
                )}

                {activeTab === 'coupons' && (
                  <button onClick={() => setShowCouponModal(true)} className="bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-sky-700 shadow-xl shadow-sky-200 transition-all active:scale-95">
                    <Plus size={20} /> Novo Cupom
                  </button>
                )}
                
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
                               <div className="flex items-center gap-2">
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(sale.created_at).toLocaleString()}</p>
                                 {sale.coupon_code && <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">Cupom: {sale.coupon_code}</span>}
                               </div>
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

            {activeTab === 'coupons' && (
              <div className="animate-fade-in">
                {showCouponModal && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <form onSubmit={saveCoupon} className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl relative">
                      <button type="button" onClick={() => setShowCouponModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                      </button>
                      <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
                        <Tag className="text-sky-500" /> Criar Cupom
                      </h2>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Código do Cupom</label>
                          <input required value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} placeholder="EX: BLACKFRIDAY50" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 placeholder:text-slate-300" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Porcentagem de Desconto (%)</label>
                          <input type="number" min="1" max="100" required value={couponForm.discount_percent} onChange={e => setCouponForm({...couponForm, discount_percent: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sky-600 text-xl" />
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl">
                          <input type="checkbox" id="coupon_active" checked={couponForm.active} onChange={e => setCouponForm({...couponForm, active: e.target.checked})} className="w-5 h-5 accent-sky-600" />
                          <label htmlFor="coupon_active" className="text-xs font-black text-slate-600 uppercase">Cupom Ativo</label>
                        </div>
                      </div>

                      <button type="submit" disabled={isSaving} className="w-full mt-8 bg-sky-600 text-white py-5 rounded-2xl font-black hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all flex items-center justify-center">
                        {isSaving ? <Loader2 className="animate-spin" /> : 'CRIAR CUPOM'}
                      </button>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coupons.map(coupon => (
                    <div key={coupon.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm group hover:shadow-xl transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600">
                          <Tag size={24} />
                        </div>
                        <button onClick={() => deleteCoupon(coupon.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1">{coupon.code}</h3>
                      <p className="text-3xl font-black text-emerald-500 mb-6">{coupon.discount_percent}% OFF</p>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${coupon.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {coupon.active ? <Check size={14} /> : <X size={14} />}
                          {coupon.active ? 'Ativo' : 'Inativo'}
                        </div>
                        <span className="text-[10px] font-bold text-slate-300">Criado em {new Date(coupon.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {coupons.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                       <Tag className="mx-auto text-slate-200 mb-4" size={48} />
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhum cupom cadastrado</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="space-y-6">
                <div className="flex bg-white p-2 rounded-2xl border border-slate-200 w-fit">
                   <button onClick={() => setActiveSalesSubTab('local')} className={`px-6 py-3 rounded-xl font-bold text-xs transition-all ${activeSalesSubTab === 'local' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Intenções & Leads (Sistema)</button>
                   <button onClick={() => setActiveSalesSubTab('api')} className={`px-6 py-3 rounded-xl font-bold text-xs transition-all ${activeSalesSubTab === 'api' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Extrato Real (Mercado Pago API)</button>
                </div>

                {activeSalesSubTab === 'local' ? (
                  <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <tr>
                            <th className="px-8 py-6">Data / Lead</th>
                            <th className="px-8 py-6">Curso Pretendido</th>
                            <th className="px-8 py-6">Cupom</th>
                            <th className="px-8 py-6">Valor Final</th>
                            <th className="px-8 py-6">Situação</th>
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
                                  {sale.coupon_code ? (
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase">{sale.coupon_code}</span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-300">-</span>
                                  )}
                               </td>
                               <td className="px-8 py-6">
                                  <span className="text-sm font-black text-slate-900">R$ {sale.amount?.toFixed(2)}</span>
                               </td>
                               <td className="px-8 py-6">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${sale.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                     {sale.status === 'Iniciado' ? 'CHECKOUT ABANDONADO' : sale.status}
                                  </span>
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
                               <td className="px-8 py-6 text-xs font-bold text-slate-600">{sale.payer?.email}</td>
                               <td className="px-8 py-6 font-black text-slate-900">R$ {sale.transaction_amount?.toFixed(2)}</td>
                               <td className="px-8 py-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusColor(sale.status)}`}>{sale.status}</span></td>
                               <td className="px-8 py-6 text-right"><a href={`https://www.mercadopago.com.br/money-out/transfer/receipt/${sale.id}`} target="_blank" rel="noreferrer" className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-sky-600 hover:text-white transition-all inline-block"><ExternalLink size={16} /></a></td>
                            </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                <form onSubmit={saveSettings} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center"><Key size={24} /></div>
                     <h2 className="text-xl font-black text-slate-900 tracking-tight">Credenciais da API</h2>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Public Key</label>
                      <input value={mpConfig.publicKey} onChange={e => setMpConfig({...mpConfig, publicKey: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs focus:ring-4 focus:ring-sky-50 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Access Token</label>
                      <input type="password" value={mpConfig.accessToken} onChange={e => setMpConfig({...mpConfig, accessToken: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs focus:ring-4 focus:ring-sky-50 outline-none transition-all" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full bg-sky-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 active:scale-[0.98]">
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
                      <input value={courseForm.thumbnail} onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sky-100 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setEditingCourse(null)} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="flex-[2] bg-sky-600 text-white py-5 rounded-2xl font-black hover:bg-sky-700 shadow-xl shadow-sky-100 active:scale-[0.98]">Salvar Alterações</button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
                  {courses.map(course => (
                    <div key={course.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden group flex flex-col hover:shadow-2xl transition-all duration-500">
                      <div className="aspect-video relative overflow-hidden">
                        <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-4 right-4 bg-sky-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">R$ {course.price.toFixed(2)}</div>
                      </div>
                      <div className="p-8 flex-grow flex flex-col">
                        <h3 className="font-black text-slate-900 mb-6 text-xl line-clamp-2">{course.title}</h3>
                        <div className="flex justify-between items-center pt-6 border-t mt-auto border-slate-50">
                          <button onClick={() => { setEditingCourse(course); setCourseForm({...course}); }} className="p-3 bg-slate-50 text-slate-400 hover:bg-sky-600 hover:text-white rounded-xl transition-all"><Edit3 size={18}/></button>
                          <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">Publicado</span>
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

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    {icon} {label}
  </button>
);

const StatCard = ({ label, value, subtext, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-sky-200 transition-all">
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">{icon}</div>
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
