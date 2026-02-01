
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
  Check,
  Users,
  Search,
  Mail
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'sales' | 'courses' | 'coupons' | 'students'>('dashboard');
  const [activeSalesSubTab, setActiveSalesSubTab] = useState<'api' | 'local'>('local');
  const [mpConfig, setMpConfig] = useState({ publicKey: '', accessToken: '', mode: 'production' });
  const [mpSales, setMpSales] = useState<any[]>([]);
  const [localSales, setLocalSales] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

      // Busca vendas locais incluindo dados do perfil (email/nome)
      const { data: localSalesData } = await supabase
        .from('sales')
        .select('*, courses(title), profiles(email, full_name)')
        .order('created_at', { ascending: false });
      if (localSalesData) setLocalSales(localSalesData);

      // Busca lista de alunos e suas matrículas
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('*, enrollments(course_id)');
      if (studentsData) setStudents(studentsData);

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
      await fetchData();
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
      const { error } = await supabase.from('courses').upsert(payload);
      if (error) throw error;
      setEditingCourse(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
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
      setShowCouponModal(false);
      setCouponForm({ code: '', discount_percent: 10, active: true });
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('platform_settings').upsert({ key: 'mercadopago_config', value: mpConfig });
      if (error) throw error;
      alert("Salvo!");
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalApproved = mpSales
    .filter(s => s.status === 'approved')
    .reduce((acc, s) => acc + (s.transaction_amount || 0), 0);

  const filteredStudents = students.filter(s => 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <NavItem active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<Users size={20}/>} label="Alunos" />
          <NavItem active={activeTab === 'courses'} onClick={() => { setActiveTab('courses'); setEditingCourse(null); }} icon={<BookOpen size={20}/>} label="Cursos" />
          <NavItem active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} icon={<Tag size={20}/>} label="Cupons" />
          <NavItem active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={<CreditCard size={20}/>} label="Vendas" />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Wallet size={20}/>} label="Configurações" />
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
                   activeTab === 'students' ? 'Gestão de Alunos' :
                   activeTab === 'courses' ? 'Treinamentos' :
                   activeTab === 'coupons' ? 'Promoções' :
                   activeTab === 'sales' ? 'Gestão de Vendas' : 'Conexão MP'}
                </h1>
                <p className="text-slate-500 font-medium">Controle total da sua operação digital.</p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={refreshPayments} 
                  disabled={isRefreshing}
                  className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                  Atualizar
                </button>
              </div>
            </header>

            {activeTab === 'dashboard' && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <StatCard label="Faturamento" value={`R$ ${totalApproved.toLocaleString('pt-BR')}`} subtext="Gateways Confirmados" icon={<DollarSign className="text-emerald-500" />} color="bg-emerald-500" />
                  <StatCard label="Total Alunos" value={students.length.toString()} subtext="Cadastros na plataforma" icon={<Users className="text-sky-500" />} color="bg-sky-500" />
                  <StatCard label="Vendas Locais" value={localSales.length.toString()} subtext="Intenções e Pagos" icon={<ShoppingCart className="text-amber-500" />} color="bg-amber-500" />
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="relative max-w-md">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                    type="text" 
                    placeholder="Buscar por nome ou e-mail..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sky-50 transition-all font-medium text-sm"
                   />
                </div>

                <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <tr>
                        <th className="px-8 py-6">Aluno</th>
                        <th className="px-8 py-6">E-mail</th>
                        <th className="px-8 py-6">Cursos</th>
                        <th className="px-8 py-6">Cadastro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600 font-black text-xs uppercase">
                                 {student.full_name?.charAt(0) || student.email?.charAt(0)}
                               </div>
                               <span className="text-sm font-black text-slate-900">{student.full_name || 'Sem Nome'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm text-slate-500 font-medium">{student.email}</td>
                          <td className="px-8 py-6">
                             <span className="bg-sky-50 text-sky-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                               {(student.enrollments || []).length} Adquiridos
                             </span>
                          </td>
                          <td className="px-8 py-6 text-[10px] text-slate-400 font-bold uppercase">
                            {new Date(student.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="space-y-6">
                <div className="flex bg-white p-2 rounded-2xl border border-slate-200 w-fit mb-8">
                   <button onClick={() => setActiveSalesSubTab('local')} className={`px-6 py-3 rounded-xl font-bold text-xs transition-all ${activeSalesSubTab === 'local' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Registros Internos</button>
                   <button onClick={() => setActiveSalesSubTab('api')} className={`px-6 py-3 rounded-xl font-bold text-xs transition-all ${activeSalesSubTab === 'api' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Mercado Pago Real-time</button>
                </div>

                {activeSalesSubTab === 'local' ? (
                  <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <tr>
                            <th className="px-8 py-6">Data / Aluno</th>
                            <th className="px-8 py-6">Curso</th>
                            <th className="px-8 py-6">Valor</th>
                            <th className="px-8 py-6">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {localSales.map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="text-xs font-black text-slate-900">{sale.profiles?.full_name || 'Usuário'}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase">{sale.profiles?.email}</div>
                                  <div className="text-[9px] text-slate-300 mt-1">{new Date(sale.created_at).toLocaleString()}</div>
                               </td>
                               <td className="px-8 py-6 text-xs font-bold text-slate-600">{sale.courses?.title}</td>
                               <td className="px-8 py-6 font-black text-slate-900">R$ {sale.amount?.toFixed(2)}</td>
                               <td className="px-8 py-6">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${sale.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                     {sale.status}
                                  </span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <tr>
                            <th className="px-8 py-6">Pagamento / Email</th>
                            <th className="px-8 py-6">Valor Bruto</th>
                            <th className="px-8 py-6">Status MP</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {mpSales.map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="text-xs font-black text-slate-900">#{sale.id}</div>
                                  <div className="text-[10px] text-slate-500 font-bold">{sale.payer?.email}</div>
                               </td>
                               <td className="px-8 py-6 font-black text-slate-900">R$ {sale.transaction_amount?.toFixed(2)}</td>
                               <td className="px-8 py-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusColor(sale.status)}`}>{sale.status}</span></td>
                            </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <img src={course.thumbnail} className="w-full aspect-video object-cover" />
                    <div className="p-8">
                      <h3 className="font-black text-slate-900 text-xl mb-4">{course.title}</h3>
                      <div className="flex justify-between items-center border-t pt-6 border-slate-50">
                        <button onClick={() => { setEditingCourse(course); setCourseForm({...course}); }} className="p-3 bg-slate-50 text-slate-400 hover:bg-sky-600 hover:text-white rounded-xl transition-all"><Edit3 size={18}/></button>
                        <span className="text-[10px] font-black text-sky-600 uppercase">R$ {course.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Outras abas (Settings, Coupons) seguem o padrão anterior... */}
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
  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">{icon}</div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 mb-2">{value}</h4>
      <p className="text-[10px] font-bold text-slate-400 opacity-70 uppercase">{subtext}</p>
    </div>
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
