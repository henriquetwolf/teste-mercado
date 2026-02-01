
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { GraduationCap, User, ShoppingCart, Settings, LogOut, Loader2, AlertTriangle, Database, ExternalLink, Shield } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './services/supabase';
import Home from './views/Home';
import CourseDetails from './views/CourseDetails';
import Classroom from './views/Classroom';
import Checkout from './views/Checkout';
import MyCourses from './views/MyCourses';
import Admin from './views/Admin';
import Auth from './views/Auth';
import { COURSES } from './constants';

const ADMIN_EMAIL = 'wolf@wolf.com';

const Header = ({ cartCount, user }: { cartCount: number, user: any }) => {
  const handleLogout = () => supabase.auth.signOut();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
            < GraduationCap className="w-8 h-8" />
            <span>EduVantage</span>
          </Link>

          <div className="flex items-center gap-4 md:gap-8 text-slate-600 font-medium">
            <Link to="/" className="hidden md:block hover:text-emerald-600 transition-colors">Explorar</Link>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/my-courses" className="hover:text-emerald-600 transition-colors">Meus Cursos</Link>
                  <div className="relative">
                    <ShoppingCart className="w-6 h-6 text-slate-400" />
                    {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
                  </div>
                  <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm">
                        <Shield size={14} className="text-emerald-400" />
                        Painel Admin
                      </Link>
                    )}
                    <button onClick={handleLogout} className="text-slate-400 hover:text-rose-600 transition-colors p-2" title="Sair">
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/auth" className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const MissingConfig = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-200 text-center animate-fade-in">
      <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Database size={40} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Conexão Necessária</h1>
      <p className="text-slate-600 mb-8 leading-relaxed">
        As chaves do <strong>Supabase</strong> não foram encontradas ou são inválidas.
      </p>
      <a 
        href="https://supabase.com/dashboard" 
        target="_blank" 
        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
      >
        Acessar Painel Supabase <ExternalLink size={18} />
      </a>
    </div>
  </div>
);

export default function App() {
  const [cart, setCart] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setInitializing(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setInitializing(false);
    }).catch(err => {
      console.error("Supabase Session Error:", err);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return <MissingConfig />;
  }

  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  const onPurchaseComplete = async (courseId: string) => {
    if (!user) return;
    const course = COURSES.find(c => c.id === courseId);
    try {
      await supabase.from('sales').insert({
        user_id: user.id,
        course_id: courseId,
        amount: course?.price || 0,
        status: 'Aprovado',
        payment_method: 'PagSeguro'
      });
      await supabase.from('enrollments').insert({
        user_id: user.id,
        course_id: courseId
      });
    } catch (err) {
      console.error("Purchase registration error:", err);
    }
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header cartCount={cart.length} user={user} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/course/:id" element={<CourseDetails onAddToCart={(id) => !cart.includes(id) && setCart([...cart, id])} />} />
            <Route path="/classroom/:courseId" element={user ? <Classroom /> : <Navigate to="/auth" />} />
            <Route path="/checkout/:courseId" element={user ? <Checkout onComplete={onPurchaseComplete} /> : <Navigate to="/auth" />} />
            <Route path="/my-courses" element={user ? <MyCourses /> : <Navigate to="/auth" />} />
            <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" />} />
          </Routes>
        </main>
        <footer className="bg-slate-900 text-slate-400 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm">
            © 2024 EduVantage. Pagamentos processados com segurança por PagSeguro. Admin: {ADMIN_EMAIL}
          </div>
        </footer>
      </div>
    </Router>
  );
}
