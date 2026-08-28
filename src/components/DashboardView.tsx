import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  FileCheck2, 
  Download, 
  Filter, 
  Building, 
  Calendar, 
  ArrowUpRight, 
  Sparkles,
  ShieldAlert,
  HardHat,
  ChevronRight
} from 'lucide-react';
import { Project, MonthlyProductivity, User } from '../types';
import { generateMonthlyExecutiveReportPDF } from '../utils/pdfGenerator';

interface DashboardViewProps {
  projects: Project[];
  productivity: MonthlyProductivity[];
  activeUser: User;
  onNavigateToProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  productivity,
  activeUser,
  onNavigateToProject,
  onOpenNewProjectModal,
}) => {
  const [filterProjectId, setFilterProjectId] = useState<string>('TODOS');
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>('TODOS');

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (filterProjectId !== 'TODOS' && p.id !== filterProjectId) return false;
      if (filterType !== 'TODOS' && p.processType !== filterType) return false;
      if (filterJurisdiction !== 'TODOS' && p.jurisdiction !== filterJurisdiction) return false;
      return true;
    });
  }, [projects, filterProjectId, filterType, filterJurisdiction]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalSteps = 0;
    let completedSteps = 0;
    let delayedSteps = 0;
    let waitingThirdParty = 0;
    let pendingIssue = 0;
    let inProgress = 0;
    let notStarted = 0;
    let totalDocs = 0;
    const jurisdictionCount: Record<string, number> = { Municipal: 0, Estadual: 0, Federal: 0 };
    const upcomingDeadlines: { projectName: string; projectId: string; stepName: string; dueDate: string; responsible: string; isLate: boolean }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    filteredProjects.forEach(p => {
      jurisdictionCount[p.jurisdiction] = (jurisdictionCount[p.jurisdiction] || 0) + 1;

      p.steps.forEach(s => {
        totalSteps++;
        if (s.status === 'CONCLUIDA') completedSteps++;
        else if (s.status === 'EM_ANDAMENTO') inProgress++;
        else if (s.status === 'AGUARDANDO_TERCEIROS') waitingThirdParty++;
        else if (s.status === 'PENDENCIA') pendingIssue++;
        else notStarted++;

        const isLate = s.status !== 'CONCLUIDA' && !!s.dueDate && s.dueDate < todayStr;
        if (isLate) {
          delayedSteps++;
        }

        // Add to upcoming or delayed deadlines
        if (s.status !== 'CONCLUIDA' && s.dueDate) {
          upcomingDeadlines.push({
            projectId: p.id,
            projectName: p.name,
            stepName: s.name,
            dueDate: s.dueDate,
            responsible: s.responsible || 'Responsável',
            isLate,
          });
        }

        totalDocs += (s.documents || []).length;
      });
    });

    upcomingDeadlines.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const efficiencyRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      totalProjects: filteredProjects.length,
      totalSteps,
      completedSteps,
      delayedSteps,
      waitingThirdParty,
      pendingIssue,
      inProgress,
      notStarted,
      totalDocs,
      efficiencyRate,
      jurisdictionCount,
      upcomingDeadlines: upcomingDeadlines.slice(0, 5),
    };
  }, [filteredProjects]);

  const handleExportPDF = () => {
    generateMonthlyExecutiveReportPDF(projects, productivity, activeUser, 'Agosto / 2026');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Welcome & Quick PDF Export */}
      <div className="bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-sky-950/50 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Painel de Engenharia & Gestão Regulatória</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Olá, {activeUser.name.split(' ')[0]}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Acompanhamento operacional em tempo real de {projects.length} empreendimentos com rastreabilidade técnica auditável.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-gerar-relatorio-mensal"
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 backdrop-blur-md font-bold px-4 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer text-sm"
            >
              <Download className="w-4 h-4 text-sky-300" />
              <span>Exportar Relatório Mensal (PDF)</span>
            </button>

            <button
              onClick={onOpenNewProjectModal}
              className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 backdrop-blur-md font-bold px-4 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer text-sm"
            >
              <Building className="w-4 h-4 text-emerald-300" />
              <span>+ Novo Projeto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/10 flex flex-col md:flex-row items-end gap-3 text-slate-200">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-sky-400" />
            <span>Filtrar por Empreendimento</span>
          </label>
          <select
            id="select-filter-proj"
            value={filterProjectId}
            onChange={e => setFilterProjectId(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 text-slate-100 rounded-xl p-2 text-xs font-semibold focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
          >
            <option value="TODOS">Todos os Empreendimentos ({projects.length})</option>
            {projects.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tipo de Processo / Template</span>
          </label>
          <select
            id="select-filter-type"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 text-slate-100 rounded-xl p-2 text-xs font-semibold focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
          >
            <option value="TODOS">Todos os Tipos</option>
            <option value="Comercial Completo (Templo/Religioso)" className="bg-slate-900 text-slate-100">Comercial Completo (Templo/Religioso)</option>
            <option value="AVCB / CLCB" className="bg-slate-900 text-slate-100">AVCB / CLCB (Bombeiros)</option>
            <option value="Alvará de Funcionamento" className="bg-slate-900 text-slate-100">Alvará de Funcionamento</option>
            <option value="Habite-se" className="bg-slate-900 text-slate-100">Habite-se / Regularização</option>
            <option value="Obras Civis & Infraestrutura" className="bg-slate-900 text-slate-100">Obras Civis & Infraestrutura</option>
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span>Jurisdição / Órgão</span>
          </label>
          <select
            id="select-filter-jur"
            value={filterJurisdiction}
            onChange={e => setFilterJurisdiction(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 text-slate-100 rounded-xl p-2 text-xs font-semibold focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
          >
            <option value="TODOS">Todas as Jurisdições</option>
            <option value="Municipal" className="bg-slate-900 text-slate-100">Municipal (Prefeituras)</option>
            <option value="Estadual" className="bg-slate-900 text-slate-100">Estadual (Bombeiros/CETESB)</option>
            <option value="Federal" className="bg-slate-900 text-slate-100">Federal (IBAMA/INCRA)</option>
          </select>
        </div>

        {(filterProjectId !== 'TODOS' || filterType !== 'TODOS' || filterJurisdiction !== 'TODOS') && (
          <button
            onClick={() => {
              setFilterProjectId('TODOS');
              setFilterType('TODOS');
              setFilterJurisdiction('TODOS');
            }}
            className="bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-bold px-4 py-2 rounded-xl text-xs transition w-full md:w-auto h-9 cursor-pointer"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Projects */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group hover:border-sky-400/30 transition">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500/80" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>{filterProjectId === 'TODOS' ? 'Projetos Ativos' : 'Total de Etapas'}</span>
            <Building className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">
            {filterProjectId === 'TODOS' ? metrics.totalProjects : metrics.totalSteps}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {filterProjectId === 'TODOS' ? `${metrics.totalSteps} etapas monitoradas` : 'no cronograma'}
          </p>
        </div>

        {/* Delayed Steps */}
        <div className={`bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border shadow-xl relative overflow-hidden group transition ${
          metrics.delayedSteps > 0 ? 'border-rose-500/40 bg-rose-950/20' : 'border-white/10 hover:border-rose-400/30'
        }`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Etapas em Atraso</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.delayedSteps > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <p className={`text-2xl sm:text-3xl font-black mt-2 ${metrics.delayedSteps > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {metrics.delayedSteps}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {metrics.delayedSteps > 0 ? 'Exigem intervenção imediata' : 'Tudo dentro do prazo'}
          </p>
        </div>

        {/* Waiting Third-Party */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group hover:border-amber-400/30 transition">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Aguardando Terceiros</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
            {metrics.waitingThirdParty}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Órgãos públicos / Vistorias
          </p>
        </div>

        {/* Completed Steps */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group hover:border-emerald-400/30 transition">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Etapas Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            {metrics.completedSteps}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Taxa global de {metrics.efficiencyRate}%
          </p>
        </div>

        {/* Audited Documents */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group hover:border-indigo-400/30 transition">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Documentos Auditados</span>
            <FileCheck2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-400 mt-2">
            {metrics.totalDocs}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Com hash criptográfico
          </p>
        </div>

      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Monthly Productivity Bar Chart & Evolution */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  <span>Produtividade Técnica & Conclusões Mensais</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Volume de etapas concluídas no prazo vs eficiência operacional nos últimos 6 meses
                </p>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold px-2.5 py-1 rounded-full">
                SLA Médio: 93.4%
              </span>
            </div>

            {/* Custom High-Contrast Visual Productivity Chart */}
            <div className="mt-6 space-y-4">
              {productivity.map((prod) => {
                const maxSteps = 40;
                const onTimePct = prod.completedSteps > 0 ? Math.round((prod.onTimeDeliveries / prod.completedSteps) * 100) : 0;

                return (
                  <div key={prod.month} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-200 font-bold w-24">{prod.month}</span>
                      <span className="text-slate-300">
                        <b className="text-white">{prod.completedSteps}</b> etapas ({prod.onTimeDeliveries} no prazo, {prod.delayedSteps} atraso)
                      </span>
                      <span className="text-emerald-400 font-bold w-16 text-right">
                        {prod.efficiencyRate}% ef.
                      </span>
                    </div>

                    <div className="h-4 bg-slate-950/80 rounded-full overflow-hidden flex border border-white/10">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500 shadow-sm" 
                        style={{ width: `${(prod.onTimeDeliveries / maxSteps) * 100}%` }}
                        title={`${prod.onTimeDeliveries} entregas no prazo`}
                      />
                      {prod.delayedSteps > 0 && (
                        <div 
                          className="bg-rose-500 h-full transition-all duration-500 shadow-sm" 
                          style={{ width: `${(prod.delayedSteps / maxSteps) * 100}%` }}
                          title={`${prod.delayedSteps} entregas atrasadas`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                <span className="text-slate-300">Concluídas no Prazo</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-rose-500 rounded-sm"></span>
                <span className="text-slate-300">Com Atraso</span>
              </span>
            </div>
            <span className="font-semibold text-slate-300">Média de 31 etapas/mês</span>
          </div>
        </div>

        {/* Right 1 Col: Status Distribution & Jurisdiction Breakdown */}
        <div className="space-y-6">
          
          {/* Status Breakdown */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-xl">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>Distribuição de Status Atual</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-300">✅ Concluídas</span>
                <span className="font-extrabold text-emerald-200">{metrics.completedSteps} etapas</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <span className="font-bold text-sky-300">⚡ Em Andamento</span>
                <span className="font-extrabold text-sky-200">{metrics.inProgress} etapas</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="font-bold text-amber-300">⏳ Aguardando Terceiros</span>
                <span className="font-extrabold text-amber-200">{metrics.waitingThirdParty} etapas</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="font-bold text-rose-300">⚠️ Pendência Técnica</span>
                <span className="font-extrabold text-rose-200">{metrics.pendingIssue} etapas</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-slate-300">⚪ Não Iniciada</span>
                <span className="font-extrabold text-slate-400">{metrics.notStarted} etapas</span>
              </div>
            </div>
          </div>

          {/* Jurisdiction / Organs */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-xl">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Esfera / Órgão Regulador</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Municipal</p>
                <p className="text-xl font-extrabold text-white mt-1">{metrics.jurisdictionCount.Municipal || 0}</p>
                <p className="text-[10px] text-slate-400">Prefeituras</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Estadual</p>
                <p className="text-xl font-extrabold text-white mt-1">{metrics.jurisdictionCount.Estadual || 0}</p>
                <p className="text-[10px] text-slate-400">Bombeiros</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Federal</p>
                <p className="text-xl font-extrabold text-white mt-1">{metrics.jurisdictionCount.Federal || 0}</p>
                <p className="text-[10px] text-slate-400">Órgãos</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Critical Deadlines & Active Workflow Alert Box */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-base">
              Próximos Vencimentos & Etapas Críticas
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Ordem cronológica</span>
        </div>

        <div className="divide-y divide-white/5">
          {metrics.upcomingDeadlines.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              Nenhuma etapa com prazo pendente no momento.
            </div>
          ) : (
            metrics.upcomingDeadlines.map((item, idx) => (
              <div 
                key={idx}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/5 transition px-2 rounded-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.isLate ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30' : 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                    }`}>
                      {item.isLate ? '⚠️ ATRASADA' : 'NO PRAZO'}
                    </span>
                    <h4 className="font-bold text-xs text-white">{item.stepName}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <b>Empreendimento:</b> {item.projectName} | <b>Responsável:</b> {item.responsible}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Data Prevista:</span>
                    <span className={`text-xs font-bold ${item.isLate ? 'text-rose-400' : 'text-slate-200'}`}>
                      {item.dueDate.split('-').reverse().join('/')}
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigateToProject(item.projectId)}
                    className="p-1.5 text-sky-400 hover:text-sky-300 hover:bg-white/10 rounded-lg transition cursor-pointer"
                    title="Ver no Workflow"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
