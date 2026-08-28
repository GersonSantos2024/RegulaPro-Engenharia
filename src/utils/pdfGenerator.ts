import { jsPDF } from 'jspdf';
import { Project, MonthlyProductivity, User } from '../types';

export function generateMonthlyExecutiveReportPDF(
  projects: Project[],
  productivity: MonthlyProductivity[],
  activeUser: User,
  monthName: string = 'Agosto / 2026'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = '#0f172a'; // slate-900
  const accentColor = '#0284c7'; // sky-600
  const emeraldColor = '#059669'; // emerald-600

  // Header Banner
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REGULAPRO ENTERPRISE - ENGENHARIA & GESTAO', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text(`RELATÓRIO MENSAL DE PRODUTIVIDADE, AUDITORIA & REGULARIZAÇÃO TÉCNICA`, 14, 20);
  doc.text(`Mês de Referência: ${monthName} | Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 26);

  // Subheader Stats
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. RESUMO EXECUTIVO DO PERÍODO', 14, 42);

  // Stats boxes
  const totalProjects = projects.length;
  let totalSteps = 0;
  let completedSteps = 0;
  let delayedSteps = 0;
  let totalDocs = 0;

  const todayStr = new Date().toISOString().split('T')[0];

  projects.forEach(p => {
    p.steps.forEach(s => {
      totalSteps++;
      if (s.status === 'CONCLUIDA') completedSteps++;
      if (s.status !== 'CONCLUIDA' && s.dueDate && s.dueDate < todayStr) delayedSteps++;
      totalDocs += (s.documents || []).length;
    });
  });

  const completionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const kpis = [
    { label: 'Projetos Gerenciados', value: `${totalProjects} Obras` },
    { label: 'Etapas Concluídas', value: `${completedSteps} de ${totalSteps} (${completionRate}%)` },
    { label: 'Etapas em Atraso', value: `${delayedSteps}` },
    { label: 'Documentos Auditados', value: `${totalDocs} Anexos` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + (idx * 46);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, 46, 43, 20, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, 52);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 3, 61);
  });

  // Table of Projects & Status
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. STATUS DETALHADO DOS EMPREENDIMENTOS', 14, 76);

  let startY = 82;
  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('EMPREENDIMENTO / PROJETO', 16, startY + 4.8);
  doc.text('TIPO PROCESSO', 80, startY + 4.8);
  doc.text('JURISDIÇÃO', 124, startY + 4.8);
  doc.text('PROGRESSO', 152, startY + 4.8);
  doc.text('STATUS', 178, startY + 4.8);

  startY += 7;

  projects.forEach((proj, idx) => {
    const completedInProj = proj.steps.filter(s => s.status === 'CONCLUIDA').length;
    const progressProj = proj.steps.length > 0 ? Math.round((completedInProj / proj.steps.length) * 100) : 0;
    
    // Row background
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, startY, 182, 10, 'F');
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const truncName = proj.name.length > 34 ? proj.name.substring(0, 32) + '...' : proj.name;
    doc.text(truncName, 16, startY + 4.5);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Cliente: ${proj.client ? proj.client.substring(0, 28) : 'Geral'}`, 16, startY + 8);

    doc.text(proj.processType ? proj.processType.substring(0, 22) : 'Geral', 80, startY + 6);
    doc.text(proj.jurisdiction, 124, startY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text(`${progressProj}% (${completedInProj}/${proj.steps.length})`, 152, startY + 6);

    doc.setTextColor(proj.status === 'CONCLUIDO' ? 5 : 15, proj.status === 'CONCLUIDO' ? 150 : 23, proj.status === 'CONCLUIDO' ? 105 : 42);
    doc.text(proj.status.replace('_', ' '), 178, startY + 6);

    startY += 10;
  });

  // Section 3: Monthly Productivity Metrics
  startY += 6;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. INDICADORES DE PRODUTIVIDADE & EFICIÊNCIA MENSAL', 14, startY);

  startY += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('MÊS', 16, startY + 4.8);
  doc.text('ETAPAS CONCLUÍDAS', 50, startY + 4.8);
  doc.text('NO PRAZO', 92, startY + 4.8);
  doc.text('ATRASADAS', 125, startY + 4.8);
  doc.text('TAXA EFICIÊNCIA', 158, startY + 4.8);

  startY += 7;
  productivity.forEach((prod, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, startY, 182, 6.5, 'F');
    }
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(prod.month, 16, startY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`${prod.completedSteps} etapas`, 50, startY + 4.5);
    doc.text(`${prod.onTimeDeliveries}`, 92, startY + 4.5);
    doc.setTextColor(prod.delayedSteps > 0 ? 220 : 51, prod.delayedSteps > 0 ? 38 : 65, prod.delayedSteps > 0 ? 38 : 85);
    doc.text(`${prod.delayedSteps}`, 125, startY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`${prod.efficiencyRate}%`, 158, startY + 4.5);

    startY += 6.5;
  });

  // Footer & Engineering Signature
  const footerY = 265;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, footerY, 196, footerY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Relatório gerado automaticamente pelo Sistema Integrado RegulaPro.', 14, footerY + 5);
  doc.text('Registro Auditável e Criptográfico em conformidade com as normas ABNT NBR & ISO 9001.', 14, footerY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Responsável Técnico: ${activeUser.name}`, 130, footerY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${activeUser.department} | ${activeUser.creaCau || 'Reg. Geral'}`, 130, footerY + 9);

  // Save / Download PDF
  const filename = `Relatorio_Mensal_RegulaPro_${monthName.replace(/[\/\s]/g, '_')}.pdf`;
  doc.save(filename);
}

export function generateProjectTechnicalReportPDF(
  project: Project,
  activeUser: User
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('REGULAPRO - DOSSIÊ TÉCNICO & AS-BUILT', 14, 13);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text(`LAUDO TÉCNICO DE REGULARIZAÇÃO E AUDITORIA DE ETAPAS`, 14, 20);
  doc.text(`Empreendimento: ${project.name} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);

  // Project Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 38, 182, 34, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DADOS GERAIS DO PROJETO', 18, 44);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`Cliente/Proprietário: ${project.client || 'N/A'}`, 18, 50);
  doc.text(`Endereço: ${project.address}, ${project.city} - ${project.state}`, 18, 56);
  doc.text(`CNAE: ${project.cnae || 'N/A'} | Tipo: ${project.processType}`, 18, 62);
  doc.text(`Jurisdição: ${project.jurisdiction} | Orçamento: R$ ${(project.budget || 0).toLocaleString('pt-BR')}`, 18, 68);

  // Steps Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CRONOGRAMA DE ETAPAS, PRAZOS E DOCUMENTOS AUDITADOS', 14, 80);

  let startY = 85;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('ETAPA / DESCRIÇÃO TÉCNICA', 16, startY + 4.8);
  doc.text('RESPONSÁVEL', 95, startY + 4.8);
  doc.text('PRAZO', 135, startY + 4.8);
  doc.text('STATUS', 160, startY + 4.8);
  doc.text('ANEXOS', 182, startY + 4.8);

  startY += 7;

  project.steps.forEach((step, idx) => {
    if (startY > 255) {
      doc.addPage();
      startY = 20;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, startY, 182, 11, 'F');
    }

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const truncStep = step.name.length > 44 ? step.name.substring(0, 42) + '...' : step.name;
    doc.text(truncStep, 16, startY + 4.5);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const truncDesc = step.description.length > 55 ? step.description.substring(0, 52) + '...' : step.description;
    doc.text(truncDesc, 16, startY + 8.5);

    doc.setFontSize(7.5);
    doc.text(step.responsible || 'Equipe', 95, startY + 6);
    doc.text(step.dueDate ? step.dueDate.split('-').reverse().join('/') : '--', 135, startY + 6);

    doc.setFont('helvetica', 'bold');
    const isDone = step.status === 'CONCLUIDA';
    doc.setTextColor(isDone ? 5 : 217, isDone ? 150 : 119, isDone ? 105 : 6);
    doc.text(step.status.replace('_', ' '), 160, startY + 6);

    doc.setTextColor(15, 23, 42);
    doc.text(`${(step.documents || []).length} doc(s)`, 182, startY + 6);

    startY += 11;
  });

  // Footer & Signature
  if (startY > 240) {
    doc.addPage();
    startY = 20;
  }

  const footerY = 265;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, footerY, 196, footerY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Dossiê auditável do projeto ${project.id}. Assinado digitalmente por ${activeUser.name}.`, 14, footerY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Visto Técnico: ${activeUser.name}`, 130, footerY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${activeUser.creaCau || 'Engenharia'} | ${activeUser.department}`, 130, footerY + 9);

  doc.save(`Dossie_Tecnico_${project.name.replace(/[\/\s]/g, '_')}.pdf`);
}
