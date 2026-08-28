import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  FileText, 
  Box, 
  Download, 
  MessageSquare, 
  Paperclip, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  ExternalLink,
  Lock,
  Radio,
  FileCheck
} from 'lucide-react';
import { Project, ProjectStep, StepStatus, User } from '../types';
import { generateProjectTechnicalReportPDF } from '../utils/pdfGenerator';

interface ProjectsViewProps {
  projects: Project[];
  activeUser: User;
  onOpenNewProjectModal: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateStepStatus: (projectId: string, stepIndex: number, newStatus: StepStatus) => void;
  onOpenStageDocuments: (project: Project, step: ProjectStep) => void;
  onOpenAsBuilt: (project: Project) => void;
  onOpenProjectChat: (project: Project) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeUser,
  onOpenNewProjectModal,
  onEditProject,
  onDeleteProject,
  onUpdateStepStatus,
  onOpenStageDocuments,
  onOpenAsBuilt,
  onOpenProjectChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    projects.forEach((p, idx) => {
      map[p.id] = idx === 0; // First project expanded by default
    });
    return map;
  });

  const toggleExpand = (id: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cnae && p.cnae.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (statusFilter !== 'TODOS' && p.status !== statusFilter) return false;
    return true;
  });

  const canEdit = activeUser.role === 'ADMIN' || activeUser.role === 'ENGINEER_CHIEF' || activeUser.role === 'ARCHITECT';

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 drop-shadow-sm">
            <Building2 className="w-6 h-6 text-sky-400" />
            <span>Gestão Operacional de Projetos & Workflow</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Acompanhamento de etapas normativas, prazos de órgãos reguladores e repositório auditável de documentos por etapa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              onClick={onOpenNewProjectModal}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Empreendimento</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por empreendimento, cliente, CNAE ou endereço..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-xs focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 w-full sm:w-auto"
          >
            <option value="TODOS" className="bg-slate-900 text-slate-100">Todos os Status</option>
            <option value="EM_ANDAMENTO" className="bg-slate-900 text-slate-100">Em Andamento</option>
            <option value="EM_APROVACAO" className="bg-slate-900 text-slate-100">Em Aprovação</option>
            <option value="PLANEJAMENTO" className="bg-slate-900 text-slate-100">Planejamento</option>
            <option value="CONCLUIDO" className="bg-slate-900 text-slate-100">Concluído</option>
          </select>
        </div>
      </div>

      {/* Project Cards List */}
      <div className="space-y-6">
        {filteredProjects.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-xl p-12 text-center rounded-2xl border border-dashed border-white/10">
            <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-300 text-sm">Nenhum projeto encontrado</h3>
            <p className="text-xs text-slate-500 mt-1">Ajuste os filtros ou crie um novo empreendimento.</p>
          </div>
        ) : (
          filteredProjects.map(project => {
            const isExpanded = !!expandedProjects[project.id];
            const completedCount = project.steps.filter(s => s.status === 'CONCLUIDA').length;
            const progressPercent = project.steps.length > 0 
              ? Math.round((completedCount / project.steps.length) * 100) 
              : 0;

            const delayedStepsCount = project.steps.filter(
              s => s.status !== 'CONCLUIDA' && s.dueDate && s.dueDate < todayStr
            ).length;

            const totalDocsCount = project.steps.reduce(
              (acc, s) => acc + (s.documents ? s.documents.length : 0), 0
            );

            return (
              <div 
                key={project.id}
                id={`project-card-${project.id}`}
                className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 overflow-hidden transition hover:border-white/20"
              >
                {/* Project Header Banner */}
                <div className="p-5 border-b border-white/10 bg-white/5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Title & Metas */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs bg-slate-950/80 text-sky-400 border border-sky-400/20 font-bold px-2.5 py-0.5 rounded-lg">
                          {project.jurisdiction}
                        </span>
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold px-2.5 py-0.5 rounded-lg">
                          {project.processType}
                        </span>
                        {delayedStepsCount > 0 && (
                          <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-400/30 font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {delayedStepsCount} Etapa(s) em Atraso
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                          {project.name}
                        </h2>
                      </div>

                      <p className="text-xs text-slate-400 font-medium">
                        <b className="text-slate-300">Cliente:</b> {project.client} | <b className="text-slate-300">Local:</b> {project.address}, {project.city}/{project.state}
                        {project.cnae && <span> | <b className="text-slate-300">CNAE:</b> {project.cnae}</span>}
                      </p>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      
                      {/* Progress widget */}
                      <div className="w-44 space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-300">Progresso</span>
                          <span className="text-sky-400">{progressPercent}%</span>
                        </div>
                        <div className="h-2 bg-slate-950/80 rounded-full overflow-hidden border border-white/10">
                          <div 
                            className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500 rounded-full shadow-sm"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right">
                          {completedCount} de {project.steps.length} etapas
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        
                        {/* As-Built BIM / DWG Generator button */}
                        <button
                          onClick={() => onOpenAsBuilt(project)}
                          className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                          title="Abrir Visualizador 3D BIM & Gerar As-Built IFC / DWG"
                        >
                          <Box className="w-3.5 h-3.5 text-indigo-400" />
                          <span>As-Built (IFC/DWG)</span>
                        </button>

                        {/* Project Technical Dossier PDF */}
                        <button
                          onClick={() => generateProjectTechnicalReportPDF(project, activeUser)}
                          className="bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                          title="Gerar Dossiê Técnico em PDF com Histórico de Documentos"
                        >
                          <Download className="w-3.5 h-3.5 text-sky-400" />
                          <span className="hidden sm:inline">Dossiê PDF</span>
                        </button>

                        {/* Chat button */}
                        <button
                          onClick={() => onOpenProjectChat(project)}
                          className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 font-bold text-xs p-2 rounded-xl transition relative cursor-pointer"
                          title="Abrir Chat do Projeto"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {project.chat && project.chat.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-sky-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                              {project.chat.length}
                            </span>
                          )}
                        </button>

                        {/* Edit button */}
                        {canEdit && (
                          <button
                            onClick={() => onEditProject(project)}
                            className="bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10 font-bold text-xs p-2 rounded-xl transition cursor-pointer"
                            title="Editar Projeto"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete button */}
                        {activeUser.role === 'ADMIN' && (
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
                                onDeleteProject(project.id);
                              }
                            }}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 font-bold text-xs p-2 rounded-xl transition cursor-pointer"
                            title="Excluir Projeto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Expand / Collapse toggle */}
                        <button
                          onClick={() => toggleExpand(project.id)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition ml-1 cursor-pointer"
                          title={isExpanded ? 'Recolher Etapas' : 'Expandir Etapas'}
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                    </div>

                  </div>
                </div>

                {/* Expanded Stages Body */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-3 bg-slate-950/40">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
                      <span className="font-bold text-slate-300 uppercase tracking-wider">
                        Fluxo de Etapas & Anexação de Documentos Técnicos:
                      </span>
                      <span className="text-slate-400">Total de {totalDocsCount} anexos auditados no projeto</span>
                    </div>

                    <div className="space-y-3">
                      {project.steps.map((step, sIdx) => {
                        const isLate = step.status !== 'CONCLUIDA' && !!step.dueDate && step.dueDate < todayStr;
                        const docCount = step.documents ? step.documents.length : 0;

                        return (
                          <div
                            key={step.id || sIdx}
                            className={`p-3.5 rounded-2xl border transition flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                              step.status === 'CONCLUIDA'
                                ? 'bg-emerald-950/20 border-emerald-500/30'
                                : isLate
                                ? 'bg-rose-950/20 border-rose-500/40'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {/* Step Info */}
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-xs font-bold ${isLate ? 'text-rose-400' : 'text-white'}`}>
                                  {step.name}
                                </span>
                                <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-md font-semibold border border-white/5">
                                  👤 {step.responsible || 'Responsável não definido'}
                                </span>
                                {isLate && (
                                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-md font-black flex items-center gap-1 animate-pulse">
                                    <AlertTriangle className="w-3 h-3 text-rose-400" /> ATRASO
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-400">
                                <b>Início:</b> {step.startDate ? step.startDate.split('-').reverse().join('/') : '--'} |{' '}
                                <b>Prazo Previsto:</b>{' '}
                                <span className={isLate ? 'text-rose-400 font-bold' : 'font-semibold text-slate-300'}>
                                  {step.dueDate ? step.dueDate.split('-').reverse().join('/') : '--'}
                                </span>
                                {step.status === 'CONCLUIDA' && step.completedDate && (
                                  <span className="text-emerald-400 font-bold ml-2">
                                    | Concluído em: {step.completedDate.split('-').reverse().join('/')}
                                  </span>
                                )}
                              </p>

                              {/* Required docs note */}
                              {step.requiredDocsDescription && (
                                <div className="text-[11px] bg-white/5 border border-white/10 text-slate-300 p-2.5 rounded-xl flex items-start gap-1.5">
                                  <FileCheck className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                                  <span><b>Entregáveis:</b> {step.requiredDocsDescription}</span>
                                </div>
                              )}
                            </div>

                            {/* Status Selector & Document Button */}
                            <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
                              
                              {/* Stage Attachment Modal Button */}
                              <button
                                onClick={() => onOpenStageDocuments(project, step)}
                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition shadow-sm cursor-pointer ${
                                  docCount > 0
                                    ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30'
                                    : 'bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10'
                                }`}
                                title="Abrir repositório de anexos auditáveis desta etapa"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-sky-400" />
                                <span>Anexos ({docCount})</span>
                              </button>

                              {/* Status Dropdown */}
                              <select
                                value={step.status}
                                onChange={e => onUpdateStepStatus(project.id, sIdx, e.target.value as StepStatus)}
                                className={`text-xs font-bold px-3 py-2 rounded-xl border outline-none cursor-pointer transition ${
                                  step.status === 'CONCLUIDA'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                    : step.status === 'EM_ANDAMENTO'
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                                    : step.status === 'AGUARDANDO_TERCEIROS'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                    : step.status === 'PENDENCIA'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                                    : 'bg-white/10 text-slate-200 border-white/10'
                                }`}
                              >
                                <option value="NAO_INICIADA" className="bg-slate-900 text-slate-200">⚪ Não Iniciada</option>
                                <option value="EM_ANDAMENTO" className="bg-slate-900 text-slate-200">⚡ Em Andamento</option>
                                <option value="AGUARDANDO_TERCEIROS" className="bg-slate-900 text-slate-200">⏳ Aguardando Terceiros</option>
                                <option value="PENDENCIA" className="bg-slate-900 text-slate-200">⚠️ Pendência Técnica</option>
                                <option value="CONCLUIDA" className="bg-slate-900 text-slate-200">✅ Concluída</option>
                              </select>

                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
