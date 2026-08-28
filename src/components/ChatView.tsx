import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Building2, 
  User as UserIcon, 
  ShieldCheck, 
  Paperclip, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Radio, 
  AlertTriangle 
} from 'lucide-react';
import { ChatMessage, Project, User } from '../types';

interface ChatViewProps {
  projects: Project[];
  activeUser: User;
  onSendMessage: (projectId: string | undefined, text: string) => void;
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  projects,
  activeUser,
  onSendMessage,
  selectedProjectId = 'GERAL',
  onSelectProject,
}) => {
  const [currentChannel, setCurrentChannel] = useState<string>(selectedProjectId || 'GERAL');
  const [inputText, setInputText] = useState('');

  // Collect all messages for selected channel
  const currentProject = projects.find(p => p.id === currentChannel);

  const messages: ChatMessage[] = currentChannel === 'GERAL'
    ? projects.flatMap(p => p.chat.map(m => ({ ...m, projectName: p.name }))).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : (currentProject?.chat || []);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(currentChannel === 'GERAL' ? undefined : currentChannel, inputText.trim());
    setInputText('');
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>Comunicação & Registro Histórico</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
            Chat Técnico & Interações da Equipe em Tempo Real
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Registro indelével de comentários, decisões técnicas, notificações de status e alertas de telemetria.
          </p>
        </div>
      </div>

      {/* Main Chat Box Layout */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[620px]">
        
        {/* Left Sidebar: Channels List */}
        <div className="w-full md:w-80 bg-slate-950/70 backdrop-blur-md text-white border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Canais & Projetos
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            
            {/* General Team Channel */}
            <button
              onClick={() => {
                setCurrentChannel('GERAL');
                if (onSelectProject) onSelectProject('GERAL');
              }}
              className={`w-full text-left p-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                currentChannel === 'GERAL'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-md'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>Canal Geral (Todos os Empreendimentos)</span>
              </div>
            </button>

            <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Canais por Empreendimento ({projects.length})
            </div>

            {/* Individual Project Channels */}
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setCurrentChannel(p.id);
                  if (onSelectProject) onSelectProject(p.id);
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                  currentChannel === p.id
                    ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30 shadow-md'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white font-medium border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{p.name}</span>
                </div>
                {p.chat?.length > 0 && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full font-mono border border-white/5">
                    {p.chat.length}
                  </span>
                )}
              </button>
            ))}

          </div>

          <div className="p-3 bg-slate-950/90 border-t border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Conectado como: <b className="text-white">{activeUser.name.split(' ')[0]}</b></span>
          </div>
        </div>

        {/* Right Chat Area */}
        <div className="flex-1 flex flex-col bg-transparent">
          
          {/* Channel Header */}
          <div className="p-4 bg-slate-900/40 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>{currentChannel === 'GERAL' ? 'Canal Geral da Engenharia' : currentProject?.name}</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {currentChannel === 'GERAL' ? 'Visualização consolidada de todos os registros' : `${currentProject?.processType} - ${currentProject?.city}/${currentProject?.state}`}
              </p>
            </div>

            <span className="text-xs bg-white/10 border border-white/10 text-slate-200 px-2.5 py-1 rounded-full font-semibold">
              {messages.length} mensagens
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                Nenhuma mensagem neste canal ainda. Envie o primeiro comentário técnico abaixo.
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender === activeUser.name || msg.sender === activeUser.name.split(' ')[0].toUpperCase();
                const isSys = msg.isSystem || msg.sender === 'SISTEMA';

                if (isSys) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="bg-slate-800/80 text-slate-300 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>{msg.text}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-bold text-slate-300">{msg.sender}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={`p-3 rounded-2xl text-xs max-w-lg shadow-sm leading-relaxed ${
                      isMe 
                        ? 'bg-sky-500/30 text-white border border-sky-400/40 rounded-tr-none font-medium' 
                        : 'bg-slate-900/80 text-slate-200 border border-white/10 rounded-tl-none font-normal'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Footer Form */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900/40 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Escreva uma mensagem no canal ${currentChannel === 'GERAL' ? 'Geral' : (currentProject?.name || '')}...`}
              className="flex-1 bg-slate-950/60 border border-white/10 text-white p-2.5 rounded-xl text-xs focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 text-sky-200 border border-sky-400/30 p-2.5 rounded-xl transition flex items-center justify-center cursor-pointer shadow-md active:scale-95"
              title="Enviar Mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
