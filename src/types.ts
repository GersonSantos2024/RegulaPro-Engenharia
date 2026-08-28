export type UserRole = 
  | 'ADMIN' 
  | 'ENGINEER_CHIEF' 
  | 'SITE_INSPECTOR' 
  | 'ARCHITECT' 
  | 'AUDITOR' 
  | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  creaCau?: string;
  active: boolean;
}

export type StepStatus = 
  | 'NAO_INICIADA' 
  | 'EM_ANDAMENTO' 
  | 'AGUARDANDO_TERCEIROS' 
  | 'PENDENCIA' 
  | 'CONCLUIDA';

export type DocumentApprovalStatus = 
  | 'PENDENTE' 
  | 'APROVADO' 
  | 'REJEITADO' 
  | 'EM_REVISAO';

export interface StageDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  dataUrl: string; // Base64 or Blob URL
  category: 'ART_RRT' | 'MEMORIAL' | 'PLANTA' | 'LAUDO' | 'LICENCA' | 'FOTO' | 'COMPROVANTE' | 'OUTRO';
  status: DocumentApprovalStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  hash: string; // SHA-256 simulation for audit integrity
}

export interface ProjectStep {
  id: string;
  name: string;
  description: string;
  responsible: string;
  startDate: string;
  dueDate: string;
  completedDate?: string | null;
  status: StepStatus;
  documents: StageDocument[];
  requiredDocsDescription: string;
  notes?: string;
  progressPercent: number;
  order: number;
}

export interface ChatMessage {
  id: string;
  projectId?: string;
  sender: string;
  senderRole?: UserRole;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  type?: 'text' | 'status_change' | 'doc_upload' | 'alert';
}

export interface IoTDevice {
  id: string;
  projectId: string;
  name: string;
  type: 'TEMPERATURE' | 'AIR_QUALITY' | 'NOISE' | 'VIBRATION' | 'ENERGY' | 'SMOKE' | 'WATER';
  unit: string;
  currentValue: number;
  minThreshold: number;
  maxThreshold: number;
  status: 'ONLINE' | 'ALERT' | 'OFFLINE';
  lastPing: string;
  location: string;
  history: { time: string; value: number }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  projectId?: string;
  projectName?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  cnae?: string;
  jurisdiction: 'Municipal' | 'Estadual' | 'Federal';
  processType: 
    | 'Comercial Completo (Templo/Religioso)' 
    | 'AVCB / CLCB' 
    | 'Alvará de Funcionamento' 
    | 'Habite-se' 
    | 'Obras Civis & Infraestrutura'
    | 'Personalizado';
  address: string;
  city: string;
  state: string;
  budget?: number;
  startDate: string;
  targetEndDate: string;
  status: 'PLANEJAMENTO' | 'EM_ANDAMENTO' | 'EM_APROVACAO' | 'CONCLUIDO' | 'PAUSADO';
  steps: ProjectStep[];
  chat: ChatMessage[];
  auditLogs: AuditLog[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  buildingSpecs?: {
    totalAreaM2: number;
    floors: number;
    occupancyGroup: string;
    constructionType: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
  projectId?: string;
  stepId?: string;
}

export interface MonthlyProductivity {
  month: string;
  completedSteps: number;
  onTimeDeliveries: number;
  delayedSteps: number;
  activeProjects: number;
  efficiencyRate: number;
  documentsApproved: number;
}
