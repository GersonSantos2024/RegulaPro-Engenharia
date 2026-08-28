import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Plus, 
  Trash2, 
  Layers, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Check,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { Project, ProjectStep, StepStatus, User } from '../types';
import { TEMPLATES_DATA } from '../data/defaultData';

interface ProjectModalProps {
  projectToEdit?: Project | null;
  activeUser: User;
  onClose: () => void;
  onSaveProject: (projectData: Partial<Project>) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  projectToEdit,
  activeUser,
  onClose,
  onSaveProject,
}) => {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [cnae, setCnae] = useState('');
  const [jurisdiction, setJurisdiction] = useState<'Municipal' | 'Estadual' | 'Federal'>('Municipal');
  const [processType, setProcessType] = useState<Project['processType']>('Comercial Completo (Templo/Religioso)');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [budget, setBudget] = useState<number>(500000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetEndDate, setTargetEndDate] = useState('');
  
  // Building specs for BIM / As-Built
  const [totalAreaM2, setTotalAreaM2] = useState<number>(1800);
  const [floors, setFloors] = useState<number>(2);
  const [occupancyGroup, setOccupancyGroup] = useState('Comercial / Institucional');
  const [constructionType, setConstructionType] = useState('Concreto Armado / Estrutura Mista');

  // Stages
  const [steps, setSteps] = useState<ProjectStep[]>([]);

  // Load existing project or generate from template
  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setClient(projectToEdit.client || '');
      setCnae(projectToEdit.cnae || '');
      setJurisdiction(projectToEdit.jurisdiction);
      setProcessType(projectToEdit.processType);
      setAddress(projectToEdit.address || '');
      setCity(projectToEdit.city || '');
      setState(projectToEdit.state || 'SP');
      setBudget(projectToEdit.budget || 0);
      setStartDate(projectToEdit.startDate);
      setTargetEndDate(projectToEdit.targetEndDate);
      setSteps(projectToEdit.steps || []);
      if (projectToEdit.buildingSpecs) {
        setTotalAreaM2(projectToEdit.buildingSpecs.totalAreaM2);
        setFloors(projectToEdit.buildingSpecs.floors);
        setOccupancyGroup(projectToEdit.buildingSpecs.occupancyGroup);
        setConstructionType(projectToEdit.buildingSpecs.constructionType);
      }
    } else {
      // Default: Load template
      applyTemplate('Comercial Completo (Templo/Religioso)');
    }
  }, [projectToEdit]);

  const applyTemplate = (type: Project['processType']) => {
    let tList: { n: string; d: string; resp?: string; days?: number }[] = [];

    if (type === 'Comercial Completo (Templo/Religioso)') {
      tList = TEMPLATES_DATA.templo;
    } else if (type === 'AVCB / CLCB') {
      tList = TEMPLATES_DATA.avcb;
    } else if (type === 'Alvará de Funcionamento') {
      tList = TEMPLATES_DATA.alvara;
    } else if (type === 'Habite-se') {
      tList = TEMPLATES_DATA.habitese;
    } else if (type === 'Obras Civis & Infraestrutura') {
      tList = [
        { n: '1. Licença Ambiental Prévia & Instalação (LP/LI)', d: 'EIA/RIMA, Outorga de Água e Plano de Manejo.', resp: activeUser.name, days: 30 },
        { n: '2. Terraplenagem, Drenagem & Contenções', d: 'Ensaios de Compactação de Solo e Drenagem Pluvial.', resp: activeUser.name, days: 45 },
        { n: '3. Execução de Fundações Profundas', d: 'Estacas / Tubulões com Laudo de Prova de Carga.', resp: activeUser.name, days: 40 },
        { n: '4. Infraestrutura de Redes (Água/Esgoto/Energia)', d: 'Compatibilização com concessionárias Sabesp/Enel.', resp: activeUser.name, days: 50 },
        { n: '5. Pavimentação & Vias de Acesso', d: 'Asfalto CBUQ e Guias com Ensaio Marshall.', resp: activeUser.name, days: 35 },
        { n: '6. As-Built & Termo de Recebimento de Obras (TRO)', d: 'Levantamento topográfico georreferenciado e doação das vias.', resp: activeUser.name, days: 20 }
      ];
    } else {
      // Personalizado: Single starter step
      tList = [
        { n: '1. Levantamento Preliminar & Diagnóstico', d: 'Levantamento de dados e necessidades do cliente.', resp: activeUser.name, days: 7 }
      ];
    }

    let runningDate = new Date();
    const generatedSteps: ProjectStep[] = tList.map((item, index) => {
      const iniStr = runningDate.toISOString().split('T')[0];
      const due = new Date(runningDate);
      due.setDate(due.getDate() + (item.days || 10));
      const dueStr = due.toISOString().split('T')[0];
      runningDate = new Date(due);

      return {
        id: `step-${Date.now()}-${index}`,
        name: item.n,
        description: item.d,
        responsible: item.resp || activeUser.name,
        startDate: iniStr,
        dueDate: dueStr,
        completedDate: null,
        status: index === 0 ? 'EM_ANDAMENTO' : 'NAO_INICIADA',
        progressPercent: index === 0 ? 30 : 0,
        requiredDocsDescription: item.d,
        documents: [],
        order: index + 1,
      };
    });

    setSteps(generatedSteps);
    if (generatedSteps.length > 0) {
      setTargetEndDate(generatedSteps[generatedSteps.length - 1].dueDate);
    }
  };

  const handleTypeChange = (newType: Project['processType']) => {
    setProcessType(newType);
    applyTemplate(newType);
  };

  const handleAddManualStep = () => {
    const nextOrder = steps.length + 1;
    const newStep: ProjectStep = {
      id: `step-manual-${Date.now()}`,
      name: `${nextOrder}. Nova Etapa Personalizada`,
      description: 'Descrição e entregáveis da etapa.',
      responsible: activeUser.name,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'NAO_INICIADA',
      progressPercent: 0,
      requiredDocsDescription: 'Documentos e memoriais técnicos.',
      documents: [],
      order: nextOrder,
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (index: number, field: keyof ProjectStep, value: unknown) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o Nome do Empreendimento / Cliente.');
      return;
    }
    if (steps.length === 0) {
      alert('O projeto deve ter ao menos 1 etapa.');
      return;
    }

    const payload: Partial<Project> = {
      name: name.trim(),
      client: client.trim() || name.trim(),
      cnae: cnae.trim(),
      jurisdiction,
      processType,
      address: address.trim() || 'Endereço Principal',
      city: city.trim() || 'São Paulo',
      state: state.trim() || 'SP',
      budget: Number(budget) || 0,
      startDate,
      targetEndDate: targetEndDate || steps[steps.length - 1]?.dueDate || startDate,
      status: projectToEdit ? projectToEdit.status : 'EM_ANDAMENTO',
      steps,
      authorId: projectToEdit ? projectToEdit.authorId : activeUser.id,
      authorName: projectToEdit ? projectToEdit.authorName : activeUser.name,
      buildingSpecs: {
        totalAreaM2: Number(totalAreaM2) || 1000,
        floors: Number(floors) || 1,
        occupancyGroup: occupancyGroup || 'Comercial',
        constructionType: constructionType || 'Alvenaria Estrutural'
      }
    };

    onSaveProject(payload);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900/90 backdrop-blur-2xl w-full max-w-5xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/80 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                {projectToEdit ? 'Editar Empreendimento & Cronograma' : 'Cadastrar Novo Empreendimento / Obra'}
              </h2>
              <p className="text-xs text-slate-400">
                Geração automática de fluxo regulatório, matriz de documentos e parâmetros As-Built
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-transparent">
          
          {/* General Data Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>1. Informações Cadastrais do Empreendimento</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome do Empreendimento / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Complexo Religioso Betel / Edifício Residencial Solar"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs font-semibold focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Cliente / Solicitante
                </label>
                <input
                  type="text"
                  value={client}
                  onChange={e => setClient(e.target.value)}
                  placeholder="Ex: Associação Beneficente Betel"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Template de Processo * (Gera Fluxo e Prazos)
                </label>
                <select
                  value={processType}
                  onChange={e => handleTypeChange(e.target.value as Project['processType'])}
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs font-bold focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                >
                  <option value="Comercial Completo (Templo/Religioso)" className="bg-slate-900 text-white">Comercial Completo (Templo/Religioso) - 14 Etapas</option>
                  <option value="AVCB / CLCB" className="bg-slate-900 text-white">AVCB / CLCB (Bombeiros) - 12 Etapas</option>
                  <option value="Alvará de Funcionamento" className="bg-slate-900 text-white">Alvará de Funcionamento - 12 Etapas</option>
                  <option value="Habite-se" className="bg-slate-900 text-white">Habite-se / Regularização - 14 Etapas</option>
                  <option value="Obras Civis & Infraestrutura" className="bg-slate-900 text-white">Obras Civis & Infraestrutura - 6 Etapas</option>
                  <option value="Personalizado" className="bg-slate-900 text-white">Personalizado (Criar do Zero)</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Órgão / Jurisdição *
                </label>
                <select
                  value={jurisdiction}
                  onChange={e => setJurisdiction(e.target.value as 'Municipal' | 'Estadual' | 'Federal')}
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs font-bold focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                >
                  <option value="Municipal" className="bg-slate-900 text-white">Municipal (Prefeituras)</option>
                  <option value="Estadual" className="bg-slate-900 text-white">Estadual (Bombeiros/CETESB/DAEE)</option>
                  <option value="Federal" className="bg-slate-900 text-white">Federal (IBAMA/INCRA/SPU)</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  CNAE Principal
                </label>
                <input
                  type="text"
                  value={cnae}
                  onChange={e => setCnae(e.target.value)}
                  placeholder="Ex: 9491-0/00 ou 4120-4/00"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Endereço da Edificação / Obra
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ex: Av. das Nações Unidas, 1450"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Município
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Ex: São Paulo"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Orçamento Estimado (R$)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs font-bold focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Building Specs for BIM / As-Built Generation Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>2. Especificações Técnicas para Modelo BIM As-Built (IFC & DWG)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Área Construída Total (m²)
                </label>
                <input
                  type="number"
                  value={totalAreaM2}
                  onChange={e => setTotalAreaM2(Number(e.target.value))}
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs font-bold focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Qtd. de Pavimentos
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={floors}
                  onChange={e => setFloors(Number(e.target.value))}
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs font-bold focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Grupo de Ocupação / Uso
                </label>
                <input
                  type="text"
                  value={occupancyGroup}
                  onChange={e => setOccupancyGroup(e.target.value)}
                  placeholder="Ex: F-2 (Templos/Locais Reunião)"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tipo Estrutural Predominante
                </label>
                <input
                  type="text"
                  value={constructionType}
                  onChange={e => setConstructionType(e.target.value)}
                  placeholder="Ex: Concreto Armado / Metálica"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Stages Workflow Builder Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-400" />
                  <span>3. Fluxograma de Etapas, Prazos e Responsáveis ({steps.length} Etapas)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cada etapa possui controle de status, prazos e seu próprio repositório auditável de anexos.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddManualStep}
                className="bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer border border-white/10 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Etapa Manual</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {steps.map((step, idx) => (
                <div 
                  key={step.id || idx}
                  className="bg-slate-950/60 p-3.5 rounded-xl border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center hover:border-white/20 transition"
                >
                  <div className="md:col-span-5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Nome da Etapa #{idx + 1}
                    </label>
                    <input
                      type="text"
                      value={step.name}
                      onChange={e => handleUpdateStep(idx, 'name', e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 p-2 text-xs font-bold text-white rounded-lg outline-none focus:border-sky-400/50"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Responsável
                    </label>
                    <input
                      type="text"
                      value={step.responsible}
                      onChange={e => handleUpdateStep(idx, 'responsible', e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 p-2 text-xs text-slate-200 rounded-lg outline-none focus:border-sky-400/50"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={step.startDate}
                      onChange={e => handleUpdateStep(idx, 'startDate', e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 p-2 text-xs text-slate-200 rounded-lg outline-none focus:border-sky-400/50"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Prazo Previsto
                    </label>
                    <input
                      type="date"
                      value={step.dueDate}
                      onChange={e => handleUpdateStep(idx, 'dueDate', e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 p-2 text-xs font-bold text-slate-200 rounded-lg outline-none focus:border-sky-400/50"
                    />
                  </div>

                  <div className="md:col-span-1 text-right">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Ação
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="Excluir Etapa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stage description & required docs line */}
                  <div className="md:col-span-12">
                    <input
                      type="text"
                      value={step.requiredDocsDescription || step.description}
                      onChange={e => {
                        handleUpdateStep(idx, 'requiredDocsDescription', e.target.value);
                        handleUpdateStep(idx, 'description', e.target.value);
                      }}
                      placeholder="Ex: ARTs, Memoriais de cálculo, Plantas, Laudos exigidos nesta etapa..."
                      className="w-full bg-slate-900/60 border border-dashed border-white/15 p-2 text-[11px] text-slate-300 rounded-lg outline-none focus:border-sky-400/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-4 border-t border-white/10 bg-slate-950/60 rounded-2xl flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white/10 hover:bg-white/15 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 font-bold px-6 py-2 rounded-xl text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{projectToEdit ? 'Atualizar Projeto' : 'Salvar e Iniciar Projeto'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
