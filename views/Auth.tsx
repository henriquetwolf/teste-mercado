
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { GraduationCap, Mail, Lock, ArrowRight, Loader2, Github, Chrome, ShieldAlert, AlertCircle, Info, ExternalLink, UserPlus, Users, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('wolf@wolf.com');
  const [password, setPassword] = useState('quinho1');
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string, type?: 'warning' | 'error' | 'critical' | 'auth_fail' } | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            setError({ 
              message: "E-mail não confirmado. Verifique sua caixa de entrada ou desative 'Confirm Email' no painel do Supabase.",
              type: 'warning'
            });
            return;
          }
          if (signInError.message.includes('Email logins are disabled')) {
            setError({ 
              message: "O login por e-mail está desativado no seu Supabase. Vá em Authentication > Providers > Email e habilite o provedor.",
              type: 'critical'
            });
            return;
          }
          if (signInError.message.includes('Invalid login credentials')) {
            setError({
              message: "Credenciais inválidas. Se você ainda não criou sua conta, utilize a aba 'Cadastrar' acima.",
              type: 'auth_fail'
            });
            return;
          }
          throw signInError;
        }
        navigate('/');
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
              role: role // 'student' ou 'instructor'
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('Email logins are disabled')) {
            setError({ 
              message: "O cadastro por e-mail está desativado. Habilite o provedor 'Email' no painel do Supabase em Authentication > Providers.",
              type: 'critical'
            });
            return;
          }
          throw signUpError;
        }

        if (data.user && !data.session) {
          setError({ 
            message: "Conta criada! No entanto, a confirmação de e-mail está ativa no seu Supabase. Verifique seu e-mail para ativar a conta.",
            type: 'warning'
          });
          setIsLogin(true);
        } else if (data.user && data.session) {
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError({ message: err.message || "Ocorreu um erro na autenticação." });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (login: boolean) => {
    setIsLogin(login);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
        <div className="bg-indigo-600 p-8 text-center text-white relative">
          <div className="absolute top-4 right-4 opacity-20">
             <Sparkles size={40} />
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-4">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold italic tracking-tighter">EDUVANTAGE</h1>
          <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-2">Sua jornada rumo ao conhecimento</p>
        </div>

        <div className="p-8">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
            <button 
              onClick={() => toggleMode(true)}
              className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => toggleMode(false)}
              className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Eu quero ser...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${role === 'student' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <Users size={18} />
                    <span className="text-xs font-black uppercase">Aluno</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('instructor')}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${role === 'instructor' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <Briefcase size={18} />
                    <span className="text-xs font-black uppercase">Professor</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className={`p-4 rounded-xl animate-shake border ${
                error.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' : 
                error.type === 'critical' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                error.type === 'auth_fail' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                'bg-rose-50 border-rose-100 text-rose-600'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {error.type === 'warning' ? <Info size={16} /> : <ShieldAlert size={16} />}
                  <span className="text-xs font-black uppercase">
                    {error.type === 'warning' ? 'Atenção' : 
                     error.type === 'critical' ? 'Configuração Necessária' : 
                     error.type === 'auth_fail' ? 'Acesso Negado' : 'Erro'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium mb-2">{error.message}</p>
                
                {error.type === 'critical' && (
                  <a 
                    href="https://supabase.com/dashboard/project/_/auth/providers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors uppercase"
                  >
                    Abrir Painel Supabase <ExternalLink size={10} />
                  </a>
                )}

                {error.type === 'auth_fail' && (
                  <button
                    type="button"
                    onClick={() => toggleMode(false)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-600 text-white px-2 py-1 rounded hover:bg-rose-700 transition-colors uppercase"
                  >
                    Criar conta agora <UserPlus size={10} />
                  </button>
                )}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">E-mail de acesso</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-70 ${isLogin ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-100'}`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {isLogin ? 'Entrar na Plataforma' : 'Criar minha Conta'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {email === 'wolf@wolf.com' && isLogin && (
            <div className="mt-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 text-[10px] font-black uppercase text-center flex items-center justify-center gap-2">
              <AlertCircle size={14} />
              Modo Admin Sugerido
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Sparkles = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M3 5h4"/><path d="M21 17v4"/><path d="M19 19h4"/>
  </svg>
);
