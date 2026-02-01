
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  GraduationCap, 
  ShoppingCart, 
  LogOut, 
  Loader2, 
  Shield, 
  Presentation, 
  Layout, 
  Search,
  BookOpen,
  Settings
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './services/supabase';
import Home from './views/Home.tsx';
import CourseDetails from './views/CourseDetails.tsx';
import Classroom from './views/Classroom.tsx';
import Checkout from './views/Checkout.tsx';
import MyCourses from './views/MyCourses.tsx';
import Admin from './views/Admin.tsx';
import Auth from './views/Auth.tsx';
import InstructorDashboard from './views/InstructorDashboard.tsx';

const ADMIN_EMAIL = 'wolf@wolf.com';

const Header = ({ cartCount, user }: { cartCount: number, user: any }) => {
  const handleLogout = () => supabase.auth.signOut();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-indigo-600 font-black text-2xl italic tracking-tighter">
              <GraduationCap className="w-10 h-10" />
              <span>EDUVANTAGE</span>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-6 text-slate-500 font-bold text-xs uppercase tracking-widest">
              <Link to="/" className="hover:text-indigo-600 transition-colors">Explorar</Link>
              {user && <Link to="/my-courses" className="hover:text-indigo-600 transition-colors">Meus Cursos</Link>}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-slate-800 transition-all border border-slate-700">
                      <Shield size={14} className="text-amber-400" />
                      MASTER ADMIN
                    </Link>
                  )}
                  <Link to="/instructor" className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-all border border-indigo-100">
                    <Presentation size={14} />
                    PROFESSOR
                  </Link>
                </div>

                <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

                <div className="flex items-center gap-4">
                  <button onClick={handleLogout} className="text-slate-400 hover:text-rose-600 p-2 transition-colors" title="Sair">
                    <LogOut size={20} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-black text-indigo-600 text-xs uppercase">
                    {user.email?.charAt(0)}
                  </div>
                </div>
              </>
            ) : (
              <Link to="/auth" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                Entrar na Plataforma
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default function App() {
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
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando Ecossistema...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 font-['Inter']">
        <Header cartCount={0} user={user} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/course/:id" element={<CourseDetails onAddToCart={() => {}} />} />
            <Route path="/classroom/:courseId" element={user ? <Classroom /> : <Navigate to="/auth" />} />
            <Route path="/checkout/:courseId" element={user ? <Checkout onComplete={() => {}} /> : <Navigate to="/auth" />} />
            <Route path="/my-courses" element={user ? <MyCourses /> : <Navigate to="/auth" />} />
            <Route path="/instructor/*" element={user ? <InstructorDashboard /> : <Navigate to="/auth" />} />
            <Route path="/admin/*" element={user?.email === ADMIN_EMAIL ? <Admin /> : <Navigate to="/" />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 text-slate-300 font-black italic">
              <GraduationCap size={24} />
              <span>EDUVANTAGE PLATFORM</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
              Tecnologia Educacional com Transações Seguras PagSeguro & Mercado Pago.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
