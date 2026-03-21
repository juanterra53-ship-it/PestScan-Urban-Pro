import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, Trash2, Mail } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-emerald-900 text-white pt-[calc(1rem+env(safe-area-inset-top))] pb-6 px-6 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Política de Privacidade</h1>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">PestScan Pro v2.7.5</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-8 max-w-2xl mx-auto">
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-700">
            <ShieldCheck size={24} />
            <h2 className="text-lg font-black uppercase tracking-tight">1. Compromisso com a Privacidade</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Esta política de privacidade explica como o aplicativo <strong>PestScan Pro</strong> coleta e utiliza seus dados. Nosso compromisso é com a transparência e a segurança das suas informações, em conformidade com a LGPD (Lei Geral de Proteção de Dados).
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-700">
            <Lock size={24} />
            <h2 className="text-lg font-black uppercase tracking-tight">2. Coleta de Dados e Finalidade</h2>
          </div>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-1">E-mail e Autenticação</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Coletamos seu endereço de e-mail exclusivamente para criação de conta e login, utilizando os serviços do <strong>Supabase</strong>.
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Câmera</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                O app solicita acesso à câmera para que a Inteligência Artificial local possa identificar as pragas. As imagens processadas pela IA local <strong>não</strong> são enviadas para nossos servidores, a menos que você opte por salvá-las em seu histórico online.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-700">
            <Database size={24} />
            <h2 className="text-lg font-black uppercase tracking-tight">3. Armazenamento e Hospedagem</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Seus dados de perfil e histórico online são armazenados de forma segura nos servidores do <strong>Supabase</strong> e a interface web/backend é processada via <strong>Vercel</strong>. Ambos seguem padrões internacionais de segurança.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-700">
            <Eye size={24} />
            <h2 className="text-lg font-black uppercase tracking-tight">4. Funcionamento Offline (IA Local)</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            O sistema de identificação de 20 pragas funciona localmente no seu dispositivo. Isso garante que sua privacidade seja preservada, pois o processamento da imagem ocorre dentro do seu aparelho.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-700">
            <Trash2 size={24} />
            <h2 className="text-lg font-black uppercase tracking-tight">5. Seus Direitos</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Você pode, a qualquer momento, solicitar a exclusão de sua conta e de todos os dados associados diretamente nas configurações do aplicativo ou pelo e-mail de suporte.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-700">
            <Mail size={24} />
            <h2 className="text-lg font-black uppercase tracking-tight">6. Contato</h2>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-emerald-800 text-sm font-medium">
              Para dúvidas sobre esta política, entre em contato com nosso suporte técnico através do e-mail cadastrado no Google Play Console.
            </p>
          </div>
        </section>

        <div className="py-8 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Última atualização: Março de 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
