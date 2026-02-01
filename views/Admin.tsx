
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
  Wallet
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'sales' | 'courses'>('dashboard');
  const [mpConfig, setMpConfig] = useState({ publicKey: '', accessToken: '', mode: 'sandbox' });
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
      alert("Curso publicado com sucesso!");
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
      alert("Configurações do Mercado Pago salvas!");
    } catch (err) {
      alert("Erro ao salvar.");
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
            <BookOpen size={20} /> Meus Cursos
          </button>
          <button onClick={() => setActiveTab('sales')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sales' ? 'bg-sky-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <CreditCard size={20} /> Vendas
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
                <h1 className="text-3xl font-bold text-slate-900 capitalize">{activeTab === 'settings' ? 'Mercado Pago' : activeTab}</h1>
                <p className="text-slate-500">Gestão de pagamentos e conteúdo educacional</p>
              </div>
              {activeTab === 'courses' && !editingCourse && (
                <button onClick={() => {
                   setEditingCourse({ id: null });
                   setCourseForm({ title: '', instructor: '', price: 0, thumbnail: '', description: '', payment_link: '', modules: [] });
                }} className="bg-sky-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-700 shadow-lg transition-all">
                  <Plus size={20} /> Novo Curso
                </button>
              )}
            </header>

            {activeTab === 'settings' && (
              <form onSubmit={saveSettings} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-2xl">
                <div className="flex items-center gap-3 mb-4 text-sky-600">
                   <ShieldCheck size={32} />
                   <h2 className="text-xl font-bold">Credenciais Mercado Pago</h2>
                </div>
                <div>
                   <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Public Key</label>
                   <input value={mpConfig.publicKey} onChange={e => setMpConfig({...mpConfig, publicKey: e.target.value})} placeholder="APP_USR-..." className="w-full p-4 bg-slate-50 border rounded-xl font-mono text-sm" />
                </div>
                <div>
                   <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Access Token</label>
                   <input type="password" value={mpConfig.accessToken} onChange={e => setMpConfig({...mpConfig, accessToken: e.target.value})} placeholder="APP_USR-..." className="w-full p-4 bg-slate-50 border rounded-xl font-mono text-sm" />
                </div>
                <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl flex gap-3">
                   <Info className="text-sky-600 shrink-0" size={20} />
                   <p className="text-[10px] text-sky-800 leading-relaxed font-medium">
                      Obtenha suas credenciais no <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" className="underline font-bold">Painel de Desenvolvedores</a> do Mercado Pago.
                   </p>
                </div>
                <button type="submit" disabled={isSaving} className="w-full bg-sky-600 text-white py-4 rounded-xl font-bold hover:bg-sky-700 transition-all">
                   {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar Configurações'}
                </button>
              </form>
            )}

            {activeTab === 'courses' && (
               editingCourse ? (
                 <form onSubmit={saveCourse} className="space-y-8 bg-white p-8 rounded-3xl border animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div>
                            <label className="text-xs font-bold uppercase text-slate-400">Título do Curso</label>
                            <input required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-xl" />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase text-slate-400">Preço (R$)</label>
                            <input type="number" step="0.01" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-xl" />
                          </div>
                          <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100">
                            <label className="text-xs font-bold uppercase text-sky-600 mb-2 flex items-center gap-2 font-black tracking-tight">
                               <LinkIcon size={14}/> Preferência de Checkout (Link MP)
                            </label>
                            <input 
                              type="url"
                              value={courseForm.payment_link} 
                              onChange={e => setCourseForm({...courseForm, payment_link: e.target.value})} 
                              className="w-full p-3 bg-white border border-sky-200 rounded-lg outline-none text-sm font-mono" 
                              placeholder="https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=..."
                            />
                            <p className="text-[10px] text-sky-500 mt-2 font-medium">Crie um Link de Pagamento no Mercado Pago e cole a URL de redirecionamento aqui.</p>
                          </div>
                       </div>
                       <div>
                          <label className="text-xs font-bold uppercase text-slate-400">URL da Imagem de Capa</label>
                          <input value={courseForm.thumbnail} onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-xl mb-4" />
                          {courseForm.thumbnail && <img src={courseForm.thumbnail} className="rounded-2xl aspect-video object-cover border-4 border-white shadow-lg" />}
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <button type="button" onClick={() => setEditingCourse(null)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold">Cancelar</button>
                       <button type="submit" disabled={isSaving} className="flex-[2] bg-sky-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-sky-100">
                          {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar e Publicar'}
                       </button>
                    </div>
                 </form>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {courses.map(course => (
                     <div key={course.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group">
                        <img src={course.thumbnail} className="aspect-video object-cover" />
                        <div className="p-6">
                           <h3 className="font-bold text-slate-900 mb-1">{course.title}</h3>
                           <p className="text-xs text-slate-400 mb-4">{course.instructor}</p>
                           <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                              <span className="font-black text-sky-600">R$ {course.price.toFixed(2)}</span>
                              <div className="flex gap-2">
                                <button onClick={() => {
                                  setEditingCourse(course);
                                  setCourseForm({...course, modules: course.modules || []});
                                }} className="p-2 bg-slate-50 text-slate-400 hover:text-sky-600 rounded-lg transition-colors"><Edit3 size={16}/></button>
                                <button className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"><Trash2 size={16}/></button>
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               )
            )}
            
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm group hover:border-sky-200 transition-all">
                   <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <DollarSign />
                   </div>
                   <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Vendas Totais</div>
                   <div className="text-3xl font-black text-slate-900">R$ {sales.reduce((acc, s) => acc + (s.amount || 0), 0).toFixed(2)}</div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all">
                   <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Users />
                   </div>
                   <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Alunos Ativos</div>
                   <div className="text-3xl font-black text-slate-900">{sales.length}</div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm group hover:border-amber-200 transition-all">
                   <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <BookOpen />
                   </div>
                   <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Cursos Criados</div>
                   <div className="text-3xl font-black text-slate-900">{courses.length}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
