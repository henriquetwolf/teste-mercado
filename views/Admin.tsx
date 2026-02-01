
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
  AlertTriangle,
  Info,
  Globe,
  PlusCircle,
  Play,
  Link as LinkIcon,
  Wallet,
  ExternalLink,
  CheckCircle2
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
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    description: '',
    payment_link: '', 
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
      await supabase.from('courses').upsert({
        id: editingCourse?.id || undefined,
        ...courseForm,
        rating: 5.0,
        students: 0
      });
      alert("Curso atualizado!");
      setEditingCourse(null);
      fetchData();
    } catch (err: any) {
      alert("Erro ao salvar curso.");
    }
    setIsSaving(false);
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await supabase.from('platform_settings').upsert({ key: 'mercadopago_config', value: mpConfig }, { onConflict: 'key' });
      alert("Configurações do Mercado Pago salvas com sucesso!");
    } catch (err) {
      alert("Erro ao salvar configurações.");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white hidden lg:flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center"><Settings size={18} /></div>
            EduAdmin
          </div>
        </div>
        <nav className="p-4 flex-grow space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-sky-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BarChart3 size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('courses')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'courses' ? 'bg-sky-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BookOpen size={20} /> Cursos
          </button>
          <button onClick={() => setActiveTab('sales')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sales' ? 'bg-sky-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <CreditCard size={20} /> Transações
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-sky-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Wallet size={20} /> Mercado Pago
          </button>
        </nav>
      </div>

      <div className="flex-grow p-8 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-sky-500" size={48} /></div>
        ) : (
          <>
            <header className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tight">{activeTab === 'settings' ? 'Mercado Pago' : activeTab}</h1>
                <p className="text-slate-500">Gestão financeira e operacional da plataforma</p>
              </div>
              {activeTab === 'courses' && !editingCourse && (
                <button onClick={() => {
                   setEditingCourse({ id: null });
                   setCourseForm({ title: '', instructor: '', price: 0, thumbnail: '', description: '', payment_link: '', modules: [] });
                }} className="bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-sky-700 shadow-lg transition-all active:scale-95">
                  <Plus size={20} /> Criar Novo Curso
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
                     <h2 className="text-xl font-black text-slate-900">Configuração de Chaves</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1 tracking-widest">Public Key (Produção)</label>
                      <input value={mpConfig.publicKey} onChange={e => setMpConfig({...mpConfig, publicKey: e.target.value})} placeholder="APP_USR-..." className="w-full p-4 bg-slate-50 border rounded-2xl font-mono text-xs focus:ring-4 focus:ring-sky-50 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1 tracking-widest">Access Token (Produção)</label>
                      <input type="password" value={mpConfig.accessToken} onChange={e => setMpConfig({...mpConfig, accessToken: e.target.value})} placeholder="APP_USR-..." className="w-full p-4 bg-slate-50 border rounded-2xl font-mono text-xs focus:ring-4 focus:ring-sky-50 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex gap-4">
                     <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                     <p className="text-xs text-emerald-800 leading-relaxed">
                        Ao usar suas chaves de <strong>Produção</strong>, os pagamentos feitos pelos alunos cairão diretamente no saldo da sua conta do Mercado Pago.
                     </p>
                  </div>

                  <button type="submit" disabled={isSaving} className="w-full bg-sky-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 flex items-center justify-center gap-2">
                     {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar Chaves</>}
                  </button>
                </form>

                <div className="space-y-6">
                  <div className="bg-slate-900 text-white p-10 rounded-[32px] relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-4">Como receber meus pagamentos?</h3>
                      <ol className="space-y-4 text-sm text-slate-400 list-decimal ml-4">
                        <li>Acesse o <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" className="text-sky-400 underline font-bold inline-flex items-center gap-1">Painel de Desenvolvedores <ExternalLink size={12}/></a> do Mercado Pago.</li>
                        <li>Crie uma "Aplicação" para sua escola online.</li>
                        <li>Copie as <strong>Credenciais de Produção</strong>.</li>
                        <li>Cole no formulário ao lado e salve.</li>
                        <li>Crie um "Botão/Link de Pagamento" no painel do MP para cada curso e cole a URL nas configurações do curso aqui no EduAdmin.</li>
                      </ol>
                    </div>
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                      <ShieldCheck size={200} />
                    </div>
                  </div>

                  <div className="bg-sky-50 border border-sky-100 p-8 rounded-[32px] flex gap-4">
                     <Info className="text-sky-600 shrink-0" size={24} />
                     <div>
                        <h4 className="font-bold text-sky-900 mb-1 uppercase text-xs tracking-widest">Aviso sobre Webhooks</h4>
                        <p className="text-[11px] text-sky-700 leading-relaxed font-medium">
                          Para que o curso seja liberado <strong>automaticamente</strong> após o pagamento, você deve configurar a URL de Webhook no painel do Mercado Pago apontando para sua Edge Function no Supabase. Caso contrário, a liberação deverá ser manual na aba "Transações".
                        </p>
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
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Nome do Treinamento</label>
                            <input required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-4 focus:ring-sky-50 transition-all" />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Valor do Curso (R$)</label>
                            <input type="number" step="0.01" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-4 focus:ring-sky-50 transition-all font-bold text-sky-600" />
                          </div>
                          <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100 group">
                            <label className="text-[10px] font-black uppercase text-sky-600 mb-3 flex items-center gap-2 tracking-widest">
                               <LinkIcon size={14}/> Link de Pagamento Mercado Pago
                            </label>
                            <input 
                              type="url"
                              value={courseForm.payment_link} 
                              onChange={e => setCourseForm({...courseForm, payment_link: e.target.value})} 
                              className="w-full p-4 bg-white border border-sky-200 rounded-2xl outline-none text-xs font-mono focus:shadow-lg transition-all" 
                              placeholder="https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=..."
                            />
                            <p className="text-[9px] text-sky-500 mt-3 font-bold uppercase tracking-tighter">Gerado no menu "Botões e Links de Pagamento" do Mercado Pago.</p>
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Imagem de Capa (URL)</label>
                            <input value={courseForm.thumbnail} onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-4 focus:ring-sky-50 transition-all" />
                          </div>
                          <div className="relative group">
                            {courseForm.thumbnail ? (
                              <img src={courseForm.thumbnail} className="rounded-3xl aspect-video object-cover border-8 border-white shadow-2xl group-hover:scale-[1.02] transition-transform duration-500" />
                            ) : (
                              <div className="aspect-video bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold uppercase">Prévia da Capa</div>
                            )}
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-4 pt-6">
                       <button type="button" onClick={() => setEditingCourse(null)} className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-lg active:scale-95 transition-all">Descartar</button>
                       <button type="submit" disabled={isSaving} className="flex-[2] bg-sky-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-sky-100 active:scale-95 transition-all">
                          {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Publicar Alterações'}
                       </button>
                    </div>
                 </form>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {courses.map(course => (
                     <div key={course.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500 group">
                        <div className="aspect-video relative overflow-hidden">
                          <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-sky-600 shadow-sm">
                            R$ {course.price.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-8">
                           <h3 className="font-black text-slate-900 mb-2 text-lg line-clamp-1">{course.title}</h3>
                           <p className="text-xs text-slate-400 mb-6 font-medium">{course.instructor || 'Instrutor Padrão'}</p>
                           <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                              <div className="flex gap-2">
                                <button onClick={() => {
                                  setEditingCourse(course);
                                  setCourseForm({...course, modules: course.modules || []});
                                }} className="p-3 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-xl transition-all"><Edit3 size={18}/></button>
                                <button className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"><Trash2 size={18}/></button>
                              </div>
                              <div className={`w-3 h-3 rounded-full ${course.payment_link ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} title={course.payment_link ? 'Checkout configurado' : 'Link pendente'}></div>
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
                          <th className="px-8 py-6">Aluno</th>
                          <th className="px-8 py-6">Valor</th>
                          <th className="px-8 py-6">Status</th>
                          <th className="px-8 py-6 text-right">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {sales.map(sale => (
                          <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-8 py-6">
                                <div className="text-xs font-bold text-slate-900">#{(sale.id || '').slice(0, 8)}</div>
                                <div className="text-[10px] text-slate-400">{new Date(sale.created_at).toLocaleDateString()}</div>
                             </td>
                             <td className="px-8 py-6 text-xs text-slate-600 font-medium">{sale.user_id || 'Não identificado'}</td>
                             <td className="px-8 py-6">
                                <span className="text-sm font-black text-sky-600">R$ {(sale.amount || 0).toFixed(2)}</span>
                             </td>
                             <td className="px-8 py-6">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${sale.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                   {sale.status || 'Pendente'}
                                </span>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <button className="text-sky-600 font-black text-[10px] uppercase hover:underline">Ver Detalhes</button>
                             </td>
                          </tr>
                       ))}
                       {sales.length === 0 && (
                         <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-medium italic">Nenhuma transação registrada ainda.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
            )}
            
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm group hover:border-sky-200 transition-all hover:-translate-y-1">
                   <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                      <DollarSign size={32} />
                   </div>
                   <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Faturamento Total</div>
                   <div className="text-4xl font-black text-slate-900">R$ {sales.reduce((acc, s) => acc + (s.amount || 0), 0).toFixed(2)}</div>
                </div>
                <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all hover:-translate-y-1">
                   <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                      <Users size={32} />
                   </div>
                   <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total de Alunos</div>
                   <div className="text-4xl font-black text-slate-900">{sales.length}</div>
                </div>
                <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm group hover:border-amber-200 transition-all hover:-translate-y-1">
                   <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                      <BookOpen size={32} />
                   </div>
                   <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Catálogo de Cursos</div>
                   <div className="text-4xl font-black text-slate-900">{courses.length}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
