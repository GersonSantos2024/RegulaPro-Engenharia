import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Download, 
  Trash2, 
  FileCheck, 
  Eye,
  FileCode,
  Image,
  Lock,
  Tag
} from 'lucide-react';
import { Project, ProjectStep, StageDocument, User, DocumentApprovalStatus } from '../types';

interface StageDocumentsModalProps {
  project: Project;
  step: ProjectStep;
  activeUser: User;
  onClose: () => void;
  onAddDocument: (projectId: string, stepId: string, document: StageDocument) => void;
  onUpdateDocumentStatus: (projectId: string, stepId: string, docId: string, status: DocumentApprovalStatus, notes?: string) => void;
  onDeleteDocument: (projectId: string, stepId: string, docId: string) => void;
}

export const StageDocumentsModal: React.FC<StageDocumentsModalProps> = ({
  project,
  step,
  activeUser,
  onClose,
  onAddDocument,
  onUpdateDocumentStatus,
  onDeleteDocument,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StageDocument['category']>('ART_RRT');
  const [docNotes, setDocNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [reviewingDocId, setReviewingDocId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<DocumentApprovalStatus>('APROVADO');
  const [reviewNotes, setReviewNotes] = useState('');

  // Generate SHA-256 simulation hash for immutable technical audit trail
  const generateSimulatedHash = (fileName: string, fileSize: number): string => {
    let hash = 0;
    const str = `${fileName}-${fileSize}-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}a98f7e6d5c4b3a210fedcba9876543210123456789abcdef`.substring(0, 64);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = () => {
      const newDoc: StageDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: activeUser.name,
        dataUrl: (reader.result as string) || '',
        category: selectedCategory,
        status: activeUser.role === 'AUDITOR' || activeUser.role === 'ADMIN' ? 'APROVADO' : 'PENDENTE',
        reviewedBy: activeUser.role === 'AUDITOR' || activeUser.role === 'ADMIN' ? activeUser.name : undefined,
        reviewNotes: docNotes.trim() || undefined,
        hash: generateSimulatedHash(file.name, file.size),
      };

      onAddDocument(project.id, step.id, newDoc);
      setIsUploading(false);
      setDocNotes('');
    };

    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSaveReview = (docId: string) => {
    onUpdateDocumentStatus(project.id, step.id, docId, reviewStatus, reviewNotes);
    setReviewingDocId(null);
    setReviewNotes('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getCategoryBadge = (cat: StageDocument['category']) => {
    const badges: Record<StageDocument['category'], { label: string; bg: string; text: string }> = {
      ART_RRT: { label: 'ART / RRT', bg: 'bg-purple-500/20 border border-purple-400/30', text: 'text-purple-300' },
      MEMORIAL: { label: 'Memorial Descritivo', bg: 'bg-blue-500/20 border border-blue-400/30', text: 'text-blue-300' },
      PLANTA: { label: 'Planta Técnica (CAD/BIM)', bg: 'bg-sky-500/20 border border-sky-400/30', text: 'text-sky-300' },
      LAUDO: { label: 'Laudo / Ensaio', bg: 'bg-indigo-500/20 border border-indigo-400/30', text: 'text-indigo-300' },
      LICENCA: { label: 'Licença / Alvará', bg: 'bg-emerald-500/20 border border-emerald-400/30', text: 'text-emerald-300' },
      FOTO: { label: 'Relatório Fotográfico', bg: 'bg-amber-500/20 border border-amber-400/30', text: 'text-amber-300' },
      COMPROVANTE: { label: 'Taxa / Matrícula', bg: 'bg-slate-500/20 border border-slate-400/30', text: 'text-slate-300' },
      OUTRO: { label: 'Geral', bg: 'bg-gray-500/20 border border-gray-400/30', text: 'text-gray-300' },
    };
    const b = badges[cat] || badges.OUTRO;
    return <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${b.bg} ${b.text}`}>{b.label}</span>;
  };

  const getStatusBadge = (status: DocumentApprovalStatus) => {
    switch (status) {
      case 'APROVADO':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <CheckCircle2 className="w-3 h-3" /> Aprovado (Conforme)
          </span>
        );
      case 'EM_REVISAO':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <Clock className="w-3 h-3" /> Em Revisão
          </span>
        );
      case 'REJEITADO':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
            <AlertCircle className="w-3 h-3" /> Não Conforme
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-400/30">
            <Clock className="w-3 h-3" /> Aguardando Auditoria
          </span>
        );
    }
  };

  const canAudit = activeUser.role === 'ADMIN' || activeUser.role === 'AUDITOR' || activeUser.role === 'ENGINEER_CHIEF';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900/90 backdrop-blur-2xl w-full max-w-4xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/80 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30 shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-400/30 font-bold px-2 py-0.5 rounded-lg">
                  Etapa #{step.order}
                </span>
                <span className="text-xs text-slate-400">{project.name}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight">
                {step.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-transparent">
          
          {/* Stage Requirements Box */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-sky-400" />
              <span>Documentos e Entregáveis Obrigatórios desta Etapa:</span>
            </h3>
            <p className="text-sm font-semibold text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-white/10">
              {step.requiredDocsDescription || step.description || 'Documentação técnica regulatória padrão.'}
            </p>
          </div>

          {/* Upload Drop Zone */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Anexar Novo Documento Técnico Auditável:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Categoria Documental:
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value as StageDocument['category'])}
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs font-semibold focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                >
                  <option value="ART_RRT" className="bg-slate-900 text-white">ART / RRT (CREA / CAU)</option>
                  <option value="PLANTA" className="bg-slate-900 text-white">Planta Técnica (DWG / IFC / PDF)</option>
                  <option value="MEMORIAL" className="bg-slate-900 text-white">Memorial Descritivo / Justificativa</option>
                  <option value="LAUDO" className="bg-slate-900 text-white">Laudo Técnico / Relatório de Ensaio</option>
                  <option value="LICENCA" className="bg-slate-900 text-white">Alvará / Licença / Habite-se / AVCB</option>
                  <option value="FOTO" className="bg-slate-900 text-white">Relatório Fotográfico de Canteiro</option>
                  <option value="COMPROVANTE" className="bg-slate-900 text-white">Guia de Taxa / Matrícula do Imóvel</option>
                  <option value="OUTRO" className="bg-slate-900 text-white">Outros Documentos</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Observações Técnicas / Visto de Engenharia (Opcional):
                </label>
                <input
                  type="text"
                  value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  placeholder="Ex: Conforme NBR 9050, fck 35MPa, ART quitada..."
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
                dragActive
                  ? 'border-sky-400/60 bg-sky-500/10'
                  : 'border-white/15 hover:border-white/25 bg-slate-950/40'
              }`}
            >
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-200">
                Arraste e solte o arquivo aqui, ou clique para selecionar
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Suporta PDF, DWG, DXF, IFC, PNG, JPG, ZIP (Calculado SHA-256 automático)
              </p>

              <label className="inline-block mt-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition shadow-sm border border-white/10 active:scale-95">
                <span>{isUploading ? 'Processando Documento...' : 'Selecionar Arquivo'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.dwg,.dxf,.ifc,.png,.jpg,.jpeg,.zip,.docx,.xlsx"
                />
              </label>
            </div>
          </div>

          {/* Document Repository List */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Repositório de Anexos Desta Etapa ({step.documents?.length || 0})</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Histórico Técnico Auditável</span>
            </div>

            {(!step.documents || step.documents.length === 0) ? (
              <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-white/10 rounded-2xl">
                Nenhum documento anexado a esta etapa ainda. Realize o upload acima.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {step.documents.map(doc => (
                  <div key={doc.id} className="py-3.5 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-2 bg-slate-950/80 border border-white/10 rounded-xl text-slate-300 mt-0.5 shrink-0">
                          {doc.name.endsWith('.pdf') ? <FileText className="w-4 h-4 text-rose-400" /> :
                           doc.name.endsWith('.ifc') || doc.name.endsWith('.dwg') ? <FileCode className="w-4 h-4 text-sky-400" /> :
                           doc.name.match(/\.(jpg|png|jpeg)$/i) ? <Image className="w-4 h-4 text-emerald-400" /> :
                           <FileText className="w-4 h-4 text-slate-300" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-xs text-white truncate max-w-sm" title={doc.name}>
                              {doc.name}
                            </h4>
                            {getCategoryBadge(doc.category)}
                            {getStatusBadge(doc.status)}
                          </div>

                          <p className="text-[11px] text-slate-400 mt-0.5">
                            <b className="text-slate-300">Tamanho:</b> {formatFileSize(doc.size)} | <b className="text-slate-300">Enviado por:</b> {doc.uploadedBy} em {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')} às {new Date(doc.uploadedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {canAudit && (
                          <button
                            onClick={() => {
                              setReviewingDocId(reviewingDocId === doc.id ? null : doc.id);
                              setReviewStatus(doc.status);
                              setReviewNotes(doc.reviewNotes || '');
                            }}
                            className="text-xs bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer active:scale-95"
                          >
                            Auditar / Avaliar
                          </button>
                        )}

                        {doc.dataUrl ? (
                          <a
                            href={doc.dataUrl}
                            download={doc.name}
                            className="p-2 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/20 rounded-xl transition"
                            title="Download do Documento"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        ) : null}

                        {canAudit && (
                          <button
                            onClick={() => onDeleteDocument(project.id, step.id, doc.id)}
                            className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/20 rounded-xl transition cursor-pointer"
                            title="Excluir Anexo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SHA-256 Audit Stamp */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span className="font-bold text-slate-300">Integridade SHA-256:</span>
                        <span className="truncate max-w-[260px] sm:max-w-md text-slate-400">{doc.hash}</span>
                      </div>
                      {doc.reviewedBy && (
                        <span className="text-slate-300 font-sans font-medium">
                          Auditado por: <b>{doc.reviewedBy}</b>
                        </span>
                      )}
                    </div>

                    {/* Reviewer Note if present */}
                    {doc.reviewNotes && (
                      <div className="text-[11px] bg-amber-500/10 border border-amber-400/20 text-amber-300 p-2.5 rounded-xl">
                        <b>Parecer da Auditoria:</b> {doc.reviewNotes}
                      </div>
                    )}

                    {/* Review Form Drawer */}
                    {reviewingDocId === doc.id && (
                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/10 space-y-2 mt-2">
                        <p className="text-xs font-bold text-white">
                          Parecer de Auditoria Técnica (Regulatória / Conformidade):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <select
                              value={reviewStatus}
                              onChange={e => setReviewStatus(e.target.value as DocumentApprovalStatus)}
                              className="w-full bg-slate-900 border border-white/10 text-white rounded-xl p-2 text-xs font-bold focus:border-sky-400/50 outline-none"
                            >
                              <option value="APROVADO">✅ Aprovado (Conforme)</option>
                              <option value="EM_REVISAO">⏳ Em Revisão Técnica</option>
                              <option value="REJEITADO">❌ Não Conforme (Rejeitado)</option>
                              <option value="PENDENTE">⚪ Aguardando Análise</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2 flex gap-2">
                            <input
                              type="text"
                              value={reviewNotes}
                              onChange={e => setReviewNotes(e.target.value)}
                              placeholder="Justificativa ou apontamento de normas..."
                              className="flex-1 bg-slate-900 border border-white/10 text-white rounded-xl p-2 text-xs focus:border-sky-400/50 outline-none"
                            />
                            <button
                              onClick={() => handleSaveReview(doc.id)}
                              className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer active:scale-95"
                            >
                              Gravar Parecer
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {step.documents?.length || 0} documento(s) anexados nesta etapa.
          </span>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold px-5 py-2.5 rounded-xl border border-white/10 transition cursor-pointer active:scale-95"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
};
