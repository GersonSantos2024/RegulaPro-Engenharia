import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  Lock, 
  FileText, 
  Activity, 
  Building2,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { User, UserRole, AuditLog } from '../types';

interface AdminUsersViewProps {
  users: User[];
  activeUser: User;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onSwitchUser: (user: User) => void;
  auditLogs: AuditLog[];
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  activeUser,
  onAddUser,
  onUpdateUser,
  onSwitchUser,
  auditLogs,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('ENGINEER_CHIEF');
  const [department, setDepartment] = useState('Engenharia');
  const [creaCau, setCreaCau] = useState('');

  const permissionsMatrix: { name: string; ADMIN: boolean; ENGINEER_CHIEF: boolean; ARCHITECT: boolean; SITE_INSPECTOR: boolean; AUDITOR: boolean; CLIENT: boolean }[] = [
    { name: 'Criar / Editar Projetos & Cronogramas', ADMIN: true, ENGINEER_CHIEF: true, ARCHITECT: true, SITE_INSPECTOR: false, AUDITOR: false, CLIENT: false },
    { name: 'Exclusão Permanente de Empreendimentos', ADMIN: true, ENGINEER_CHIEF: false, ARCHITECT: false, SITE_INSPECTOR: false, AUDITOR: false, CLIENT: false },
    { name: 'Alterar Status de Etapas (Andamento/Concluído)', ADMIN: true, ENGINEER_CHIEF: true, ARCHITECT: true, SITE_INSPECTOR: true, AUDITOR: false, CLIENT: false },
    { name: 'Anexar Documentos Técnicos por Etapa', ADMIN: true, ENGINEER_CHIEF: true, ARCHITECT: true, SITE_INSPECTOR: true, AUDITOR: true, CLIENT: false },
    { name: 'Auditar & Homologar Documentos (SHA-256)', ADMIN: true, ENGINEER_CHIEF: true, ARCHITECT: false, SITE_INSPECTOR: false, AUDITOR: true, CLIENT: false },
    { name: 'Gerar e Exportar As-Built (IFC & DWG)', ADMIN: true, ENGINEER_CHIEF: true, ARCHITECT: true, SITE_INSPECTOR: false, AUDITOR: true, CLIENT: true },
    { name: 'Gerar Relatórios Mensais em PDF', ADMIN: true, ENGINEER_CHIEF: true, ARCHITECT: true, SITE_INSPECTOR: true, AUDITOR: true, CLIENT: true },
    { name: 'Conectar & Calibrar Sensores IoT', ADMIN: true, ENGINEER_CHIEF: true, ARCHITECT: false, SITE_INSPECTOR: true, AUDITOR: false, CLIENT: false },
    { name: 'Gestão de Usuários & Matriz de Acesso', ADMIN: true, ENGINEER_CHIEF: false, ARCHITECT: false, SITE_INSPECTOR: false, AUDITOR: false, CLIENT: false },
  ];

  const roleBadge: Record<UserRole, { label: string; bg: string; text: string }> = {
    ADMIN: { label: 'Administrador Geral', bg: 'bg-rose-100', text: 'text-rose-800' },
    ENGINEER_CHIEF: { label: 'Engenheiro Chefe', bg: 'bg-blue-100', text: 'text-blue-800' },
    ARCHITECT: { label: 'Arquiteta Coordenadora', bg: 'bg-purple-100', text: 'text-purple-800' },
    SITE_INSPECTOR: { label: 'Fiscal de Obra', bg: 'bg-amber-100', text: 'text-amber-800' },
    AUDITOR: { label: 'Auditora Técnica', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    CLIENT: { label: 'Cliente / Visualizador', bg: 'bg-slate-100', text: 'text-slate-800' }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      department: department.trim(),
      creaCau: creaCau.trim() || undefined,
      active: true,
    };

    onAddUser(newUser);
    setShowAddModal(false);
    setName('');
    setEmail('');
    setCreaCau('');
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Controle de Acesso & Governança Corporativa</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
            Painel Administrativo de Usuários & Permissões (RBAC)
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Gestão de perfis técnicos, registros de conselho (CREA/CAU) e matriz de privilégios de segurança.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-md transition flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Usuário Técnico</span>
        </button>
      </div>

      {/* Users List Card */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Equipe Técnica & Usuários Cadastrados ({users.length})</span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Clique em "Assumir Perfil" para testar visualizações e restrições de cada função.
            </p>
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {users.map(user => {
            const badge = roleBadge[user.role] || roleBadge.CLIENT;
            const isSelf = user.id === activeUser.id;

            return (
              <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-white/10 text-white font-bold text-sm flex items-center justify-center shadow-md">
                    {user.name.charAt(0)}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-white">{user.name}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] bg-sky-500/30 text-sky-300 border border-sky-400/40 font-bold px-1.5 py-0.2 rounded">
                          VOCÊ (ATIVO)
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      <b className="text-slate-300">Email:</b> {user.email} | <b className="text-slate-300">Depto:</b> {user.department}
                      {user.creaCau && <span> | <b className="text-slate-300">Registro:</b> {user.creaCau}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!isSelf && (
                    <button
                      onClick={() => onSwitchUser(user)}
                      className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-sky-400/30 transition cursor-pointer active:scale-95"
                    >
                      Assumir Perfil (Testar RBAC)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10">
          <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Matriz de Permissões & Privilégios (RBAC)</span>
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Definição de regras de acesso granulares por papel funcional no ciclo de vida das obras.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-white border-b border-white/10 text-[11px]">
                <th className="p-3.5 font-bold">MÓDULO / AÇÃO OPERACIONAL</th>
                <th className="p-3.5 font-bold text-center">ADMIN</th>
                <th className="p-3.5 font-bold text-center">ENG. CHEFE</th>
                <th className="p-3.5 font-bold text-center">ARQUITETO</th>
                <th className="p-3.5 font-bold text-center">FISCAL</th>
                <th className="p-3.5 font-bold text-center">AUDITOR</th>
                <th className="p-3.5 font-bold text-center">CLIENTE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 1 ? 'bg-white/5' : 'bg-transparent'}>
                  <td className="p-3.5 text-slate-200 font-bold">{row.name}</td>
                  <td className="p-3.5 text-center">
                    {row.ADMIN ? <Check className="w-4 h-4 text-emerald-400 mx-auto font-bold" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.ENGINEER_CHIEF ? <Check className="w-4 h-4 text-emerald-400 mx-auto font-bold" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.ARCHITECT ? <Check className="w-4 h-4 text-emerald-400 mx-auto font-bold" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.SITE_INSPECTOR ? <Check className="w-4 h-4 text-emerald-400 mx-auto font-bold" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.AUDITOR ? <Check className="w-4 h-4 text-emerald-400 mx-auto font-bold" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.CLIENT ? <Check className="w-4 h-4 text-emerald-400 mx-auto font-bold" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Activity Trail */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Trilha de Auditoria & Logs de Ações Registradas</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Conformidade ISO / ABNT</span>
        </div>

        <div className="p-4 divide-y divide-white/5 max-h-72 overflow-y-auto">
          {auditLogs.map(log => (
            <div key={log.id} className="py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="font-bold text-slate-200">{log.action}</span>
                <p className="text-[11px] text-slate-400">{log.details}</p>
              </div>
              <div className="text-right text-[10px] text-slate-500 font-mono">
                Por <b className="text-slate-300">{log.userName}</b> ({log.userRole}) às {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/90 backdrop-blur-2xl w-full max-w-md rounded-2xl shadow-2xl border border-white/10 p-6 space-y-4">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              <span>Cadastrar Novo Usuário da Equipe</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Eng. André Albuquerque"
                  className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl font-semibold text-white focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ex: andre.albuquerque@regulapro.com.br"
                  className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl text-white focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Papel / Nível (RBAC) *</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl font-bold text-white focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                  >
                    <option value="ADMIN" className="bg-slate-900 text-white">Administrador</option>
                    <option value="ENGINEER_CHIEF" className="bg-slate-900 text-white">Engenheiro Chefe</option>
                    <option value="ARCHITECT" className="bg-slate-900 text-white">Arquiteto(a)</option>
                    <option value="SITE_INSPECTOR" className="bg-slate-900 text-white">Fiscal de Obra</option>
                    <option value="AUDITOR" className="bg-slate-900 text-white">Auditor Técnico</option>
                    <option value="CLIENT" className="bg-slate-900 text-white">Cliente / Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Departamento</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="Ex: Engenharia Civil"
                    className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl text-white focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Registro Profissional (CREA / CAU)</label>
                <input
                  type="text"
                  value={creaCau}
                  onChange={e => setCreaCau(e.target.value)}
                  placeholder="Ex: CREA-SP 5098712345"
                  className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl text-white focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold rounded-xl transition cursor-pointer active:scale-95"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
