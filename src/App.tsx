import React, { useState, useEffect, useCallback } from 'react';
import { 
  Project, 
  User, 
  IoTDevice, 
  AppNotification, 
  MonthlyProductivity, 
  ProjectStep, 
  StepStatus, 
  StageDocument, 
  DocumentApprovalStatus,
  AuditLog
} from './types';
import { 
  DEFAULT_USERS, 
  INITIAL_PROJECTS, 
  INITIAL_IOT_DEVICES, 
  INITIAL_NOTIFICATIONS, 
  MONTHLY_PRODUCTIVITY_DATA 
} from './data/defaultData';
import { notificationManager } from './utils/notificationService';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { StageDocumentsModal } from './components/StageDocumentsModal';
import { ProjectModal } from './components/ProjectModal';
import { AsBuiltViewer } from './components/AsBuiltViewer';
import { IoTMonitoringView } from './components/IoTMonitoringView';
import { AdminUsersView } from './components/AdminUsersView';
import { ChatView } from './components/ChatView';

export default function App() {
  // State Initialization from LocalStorage or Defaults
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('regulapro_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [activeUser, setActiveUser] = useState<User>(() => {
    return users[0] || DEFAULT_USERS[0];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('regulapro_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [iotDevices, setIotDevices] = useState<IoTDevice[]>(() => {
    const saved = localStorage.getItem('regulapro_iot');
    return saved ? JSON.parse(saved) : INITIAL_IOT_DEVICES;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('regulapro_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [productivity] = useState<MonthlyProductivity[]>(MONTHLY_PRODUCTIVITY_DATA);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('regulapro_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'aud-init-1',
        timestamp: new Date().toISOString(),
        userName: 'Eng. Carlos Eduardo Silva',
        userRole: 'ADMIN',
        action: 'Inicialização do Sistema',
        details: 'Banco de dados de engenharia e telemetria carregado com sucesso.'
      }
    ];
  });

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedAsBuiltProject, setSelectedAsBuiltProject] = useState<Project>(projects[0] || INITIAL_PROJECTS[0]);
  const [selectedChatProjectId, setSelectedChatProjectId] = useState<string>('GERAL');

  // Modal States
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [activeStageDocContext, setActiveStageDocContext] = useState<{
    project: Project;
    step: ProjectStep;
  } | null>(null);

  const [isPushEnabled, setIsPushEnabled] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('regulapro_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('regulapro_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('regulapro_iot', JSON.stringify(iotDevices));
  }, [iotDevices]);

  useEffect(() => {
    localStorage.setItem('regulapro_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('regulapro_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Push Notification Capability Check
  useEffect(() => {
    setIsPushEnabled(notificationManager.isPushEnabled());
  }, []);

  const handleRequestPush = async () => {
    const granted = await notificationManager.requestPushPermission();
    setIsPushEnabled(granted);
    if (granted) {
      addNotification('🔔 Notificações Push Ativadas', 'Você receberá avisos em tempo real de prazos e telemetria.', 'success');
      notificationManager.sendPushNotification('RegulaPro Enterprise', {
        body: 'Notificações push em tempo real ativadas com sucesso!'
      });
    }
  };

  // Helper to add in-app + push notification
  const addNotification = useCallback((title: string, message: string, type: AppNotification['type'] = 'info', projectId?: string) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      projectId
    };

    setNotifications(prev => [newNotif, ...prev]);
    notificationManager.playNotificationSound();
    notificationManager.sendPushNotification(title, { body: message });
  }, []);

  // Helper to log audit trail
  const addAuditLog = useCallback((action: string, details: string, projectId?: string, projectName?: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: activeUser.name,
      userRole: activeUser.role,
      action,
      details,
      projectId,
      projectName
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [activeUser]);

  // Periodic IoT Real-Time Simulation (Updates every 8 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setIotDevices(prevDevices => {
        return prevDevices.map(dev => {
          // slight realistic delta
          const delta = (Math.random() - 0.48) * (dev.type === 'TEMPERATURE' ? 0.3 : dev.type === 'NOISE' ? 1.5 : 0.05);
          const rawVal = dev.currentValue + delta;
          const newVal = Number(rawVal.toFixed(dev.type === 'TEMPERATURE' || dev.type === 'NOISE' ? 1 : 2));

          const isOverMax = newVal > dev.maxThreshold;
          const isUnderMin = newVal < dev.minThreshold;
          const newStatus = isOverMax || isUnderMin ? 'ALERT' : 'ONLINE';

          // Trigger push notification if status just changed to ALERT
          if (newStatus === 'ALERT' && dev.status !== 'ALERT') {
            addNotification(
              `⚠️ Alerta IoT: ${dev.name}`,
              `Leitura de ${newVal} ${dev.unit} ultrapassou os limites de segurança configurados.`,
              'alert',
              dev.projectId
            );
          }

          const newHistory = [...dev.history];
          if (newHistory.length > 8) newHistory.shift();
          const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          newHistory.push({ time: nowStr, value: newVal });

          return {
            ...dev,
            currentValue: newVal,
            status: newStatus,
            lastPing: 'Agora',
            history: newHistory
          };
        });
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [addNotification]);

  // Project Creation / Edit Handlers
  const handleSaveProject = (projectData: Partial<Project>) => {
    if (projectToEdit) {
      // Update
      setProjects(prev => prev.map(p => {
        if (p.id === projectToEdit.id) {
          const updated: Project = {
            ...p,
            ...projectData,
            updatedAt: new Date().toISOString()
          } as Project;
          return updated;
        }
        return p;
      }));

      addAuditLog('Edição de Projeto', `Projeto "${projectData.name}" atualizado por ${activeUser.name}.`, projectToEdit.id, projectData.name);
      addNotification('✏️ Projeto Atualizado', `O empreendimento "${projectData.name}" foi atualizado com sucesso.`, 'info');
    } else {
      // Create new
      const newProjId = `proj-${Date.now()}`;
      const newProject: Project = {
        id: newProjId,
        name: projectData.name || 'Novo Empreendimento',
        client: projectData.client || '',
        cnae: projectData.cnae || '',
        jurisdiction: projectData.jurisdiction || 'Municipal',
        processType: projectData.processType || 'Comercial Completo (Templo/Religioso)',
        address: projectData.address || '',
        city: projectData.city || 'São Paulo',
        state: projectData.state || 'SP',
        budget: projectData.budget || 0,
        startDate: projectData.startDate || new Date().toISOString().split('T')[0],
        targetEndDate: projectData.targetEndDate || '',
        status: 'EM_ANDAMENTO',
        steps: projectData.steps || [],
        chat: [
          {
            id: `msg-${Date.now()}`,
            sender: 'SISTEMA',
            text: `Empreendimento cadastrado no sistema por ${activeUser.name} (${activeUser.role}).`,
            timestamp: new Date().toISOString(),
            isSystem: true,
            type: 'status_change'
          }
        ],
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userName: activeUser.name,
            userRole: activeUser.role,
            action: 'Criação do Empreendimento',
            details: `Cadastrado com ${projectData.steps?.length || 0} etapas regulatórias.`
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: activeUser.id,
        authorName: activeUser.name,
        buildingSpecs: projectData.buildingSpecs
      };

      setProjects(prev => [newProject, ...prev]);
      addAuditLog('Criação de Projeto', `Novo projeto "${newProject.name}" cadastrado com ${newProject.steps.length} etapas.`, newProjId, newProject.name);
      addNotification('➕ Novo Empreendimento', `Empreendimento "${newProject.name}" criado com sucesso!`, 'success');
    }

    setShowProjectModal(false);
    setProjectToEdit(null);
  };

  const handleDeleteProject = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    addAuditLog('Exclusão de Projeto', `Projeto "${proj?.name}" excluído por ${activeUser.name}.`, projectId, proj?.name);
    addNotification('🗑️ Projeto Removido', `O projeto foi excluído permanentemente.`, 'warning');
  };

  // Step Status Update Handler
  const handleUpdateStepStatus = (projectId: string, stepIndex: number, newStatus: StepStatus) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedSteps = [...p.steps];
        const step = updatedSteps[stepIndex];
        if (!step) return p;

        const oldStatus = step.status;
        step.status = newStatus;
        if (newStatus === 'CONCLUIDA') {
          step.completedDate = new Date().toISOString().split('T')[0];
          step.progressPercent = 100;
        } else {
          step.completedDate = null;
          step.progressPercent = newStatus === 'EM_ANDAMENTO' ? 50 : 0;
        }

        const sysMsg = {
          id: `chat-${Date.now()}`,
          sender: 'SISTEMA',
          text: `[${activeUser.name}] alterou a etapa "${step.name}" de ${oldStatus} para ${newStatus}.`,
          timestamp: new Date().toISOString(),
          isSystem: true,
          type: 'status_change' as const
        };

        const updatedChat = [...(p.chat || []), sysMsg];

        return {
          ...p,
          steps: updatedSteps,
          chat: updatedChat,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    const targetProj = projects.find(p => p.id === projectId);
    const targetStep = targetProj?.steps[stepIndex];
    if (targetStep) {
      addAuditLog(
        'Alteração de Status de Etapa',
        `Etapa "${targetStep.name}" alterada para ${newStatus} no projeto "${targetProj?.name}".`,
        projectId,
        targetProj?.name
      );

      if (newStatus === 'CONCLUIDA') {
        addNotification(
          '✅ Etapa Concluída!',
          `A etapa "${targetStep.name}" foi marcada como Concluída no projeto "${targetProj?.name}".`,
          'success',
          projectId
        );
      }
    }
  };

  // Stage Document Actions
  const handleAddDocumentToStep = (projectId: string, stepId: string, document: StageDocument) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedSteps = p.steps.map(s => {
          if (s.id === stepId) {
            return {
              ...s,
              documents: [document, ...(s.documents || [])]
            };
          }
          return s;
        });

        const sysMsg = {
          id: `chat-doc-${Date.now()}`,
          sender: 'SISTEMA',
          text: `[${activeUser.name}] anexou o documento "${document.name}" (SHA-256: ${document.hash.substring(0, 10)}...).`,
          timestamp: new Date().toISOString(),
          isSystem: true,
          type: 'doc_upload' as const
        };

        return {
          ...p,
          steps: updatedSteps,
          chat: [...(p.chat || []), sysMsg],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    // Update active context modal if open
    if (activeStageDocContext) {
      setActiveStageDocContext(prev => {
        if (!prev) return null;
        return {
          ...prev,
          step: {
            ...prev.step,
            documents: [document, ...(prev.step.documents || [])]
          }
        };
      });
    }

    addAuditLog('Anexação de Documento Auditado', `Documento "${document.name}" anexado na etapa "${activeStageDocContext?.step.name}". Hash SHA-256: ${document.hash}.`, projectId);
    addNotification('📄 Novo Anexo Auditado', `Documento "${document.name}" foi registrado com sucesso.`, 'info', projectId);
  };

  const handleUpdateDocumentStatus = (projectId: string, stepId: string, docId: string, status: DocumentApprovalStatus, notes?: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedSteps = p.steps.map(s => {
          if (s.id === stepId) {
            const updatedDocs = (s.documents || []).map(d => {
              if (d.id === docId) {
                return {
                  ...d,
                  status,
                  reviewedBy: activeUser.name,
                  reviewNotes: notes || d.reviewNotes
                };
              }
              return d;
            });
            return { ...s, documents: updatedDocs };
          }
          return s;
        });
        return { ...p, steps: updatedSteps, updatedAt: new Date().toISOString() };
      }
      return p;
    }));

    // Update active modal context
    if (activeStageDocContext) {
      setActiveStageDocContext(prev => {
        if (!prev) return null;
        const updatedDocs = (prev.step.documents || []).map(d => {
          if (d.id === docId) {
            return { ...d, status, reviewedBy: activeUser.name, reviewNotes: notes || d.reviewNotes };
          }
          return d;
        });
        return { ...prev, step: { ...prev.step, documents: updatedDocs } };
      });
    }

    addAuditLog('Auditoria de Documento', `Documento avaliado como "${status}" por ${activeUser.name}.`, projectId);
  };

  const handleDeleteDocument = (projectId: string, stepId: string, docId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedSteps = p.steps.map(s => {
          if (s.id === stepId) {
            return {
              ...s,
              documents: (s.documents || []).filter(d => d.id !== docId)
            };
          }
          return s;
        });
        return { ...p, steps: updatedSteps };
      }
      return p;
    }));

    if (activeStageDocContext) {
      setActiveStageDocContext(prev => {
        if (!prev) return null;
        return {
          ...prev,
          step: {
            ...prev.step,
            documents: (prev.step.documents || []).filter(d => d.id !== docId)
          }
        };
      });
    }

    addAuditLog('Exclusão de Documento', `Documento removido da etapa por ${activeUser.name}.`, projectId);
  };

  // Chat Message Sender
  const handleSendMessage = (projectId: string | undefined, text: string) => {
    const targetProjId = projectId || projects[0]?.id;
    if (!targetProjId) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: activeUser.name,
      senderRole: activeUser.role,
      text,
      timestamp: new Date().toISOString(),
      type: 'text' as const
    };

    setProjects(prev => prev.map(p => {
      if (p.id === targetProjId) {
        return {
          ...p,
          chat: [...(p.chat || []), newMsg]
        };
      }
      return p;
    }));
  };

  // IoT Device Handlers
  const handleAddIoTDevice = (device: IoTDevice) => {
    setIotDevices(prev => [device, ...prev]);
    addAuditLog('Conexão de Sensor IoT', `Novo sensor "${device.name}" (${device.type}) conectado.`, device.projectId);
    addNotification('📡 Sensor IoT Conectado', `Sensor "${device.name}" integrado à telemetria.`, 'info');
  };

  const handleUpdateIoTThreshold = (id: string, min: number, max: number) => {
    setIotDevices(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, minThreshold: min, maxThreshold: max };
      }
      return d;
    }));
    addAuditLog('Calibração de Sensor IoT', `Limites de segurança atualizados para [${min} ~ ${max}].`);
  };

  const handleRefreshTelemetry = () => {
    setIotDevices(prev => prev.map(d => {
      const delta = (Math.random() - 0.48) * 1.2;
      const raw = d.currentValue + delta;
      return {
        ...d,
        currentValue: Number(raw.toFixed(1)),
        lastPing: 'Agora'
      };
    }));
    addNotification('🔄 Telemetria Atualizada', 'Todos os nós IoT responderam com sinal 100%.', 'info');
  };

  // Count active IoT Alerts for top badge
  const iotAlertCount = iotDevices.filter(d => d.status === 'ALERT').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
      
      {/* Frosted Ambient Glowing Orbs */}
      <div className="pointer-events-none fixed -top-32 left-1/4 w-[650px] h-[650px] rounded-full bg-sky-500/10 blur-[130px] -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="pointer-events-none fixed top-1/3 -right-32 w-[550px] h-[550px] rounded-full bg-indigo-500/10 blur-[140px] -z-10 animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="pointer-events-none fixed -bottom-32 left-1/3 w-[700px] h-[700px] rounded-full bg-emerald-500/10 blur-[150px] -z-10 animate-pulse" style={{ animationDuration: '12s' }} />

      {/* Top Main Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        users={users}
        activeUser={activeUser}
        onSwitchUser={setActiveUser}
        notifications={notifications}
        onMarkNotificationRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
        onClearAllNotifications={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onOpenNewProjectModal={() => {
          setProjectToEdit(null);
          setShowProjectModal(true);
        }}
        onRequestPush={handleRequestPush}
        isPushEnabled={isPushEnabled}
        iotAlertCount={iotAlertCount}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 pt-6">
        
        {currentView === 'dashboard' && (
          <DashboardView
            projects={projects}
            productivity={productivity}
            activeUser={activeUser}
            onNavigateToProject={id => {
              setCurrentView('projetos');
            }}
            onOpenNewProjectModal={() => {
              setProjectToEdit(null);
              setShowProjectModal(true);
            }}
          />
        )}

        {currentView === 'projetos' && (
          <ProjectsView
            projects={projects}
            activeUser={activeUser}
            onOpenNewProjectModal={() => {
              setProjectToEdit(null);
              setShowProjectModal(true);
            }}
            onEditProject={p => {
              setProjectToEdit(p);
              setShowProjectModal(true);
            }}
            onDeleteProject={handleDeleteProject}
            onUpdateStepStatus={handleUpdateStepStatus}
            onOpenStageDocuments={(project, step) => {
              setActiveStageDocContext({ project, step });
            }}
            onOpenAsBuilt={p => {
              setSelectedAsBuiltProject(p);
              setCurrentView('asbuilt');
            }}
            onOpenProjectChat={p => {
              setSelectedChatProjectId(p.id);
              setCurrentView('chat');
            }}
          />
        )}

        {currentView === 'asbuilt' && (
          <AsBuiltViewer
            project={selectedAsBuiltProject || projects[0]}
          />
        )}

        {currentView === 'iot' && (
          <IoTMonitoringView
            devices={iotDevices}
            projects={projects}
            onAddDevice={handleAddIoTDevice}
            onUpdateDeviceThreshold={handleUpdateIoTThreshold}
            onRefreshTelemetry={handleRefreshTelemetry}
          />
        )}

        {currentView === 'chat' && (
          <ChatView
            projects={projects}
            activeUser={activeUser}
            selectedProjectId={selectedChatProjectId}
            onSendMessage={handleSendMessage}
            onSelectProject={id => setSelectedChatProjectId(id)}
          />
        )}

        {currentView === 'admin' && (
          <AdminUsersView
            users={users}
            activeUser={activeUser}
            onAddUser={u => setUsers(prev => [...prev, u])}
            onUpdateUser={u => setUsers(prev => prev.map(item => item.id === u.id ? u : item))}
            onSwitchUser={setActiveUser}
            auditLogs={auditLogs}
          />
        )}

      </main>

      {/* Project Create / Edit Modal */}
      {showProjectModal && (
        <ProjectModal
          projectToEdit={projectToEdit}
          activeUser={activeUser}
          onClose={() => {
            setShowProjectModal(false);
            setProjectToEdit(null);
          }}
          onSaveProject={handleSaveProject}
        />
      )}

      {/* Stage Document Repository & Audit Modal */}
      {activeStageDocContext && (
        <StageDocumentsModal
          project={activeStageDocContext.project}
          step={activeStageDocContext.step}
          activeUser={activeUser}
          onClose={() => setActiveStageDocContext(null)}
          onAddDocument={handleAddDocumentToStep}
          onUpdateDocumentStatus={handleUpdateDocumentStatus}
          onDeleteDocument={handleDeleteDocument}
        />
      )}

      {/* Frosted Glass Footer */}
      <footer className="bg-slate-950/60 backdrop-blur-xl border-t border-white/10 py-5 mt-12 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs">
          <p className="font-semibold text-slate-300">RegulaPro Enterprise &copy; 2026 - Engenharia, As-Built BIM/CAD & Gestão Regulatória</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Em conformidade com ABNT NBR 9050, NBR 5410, NBR 10151, ISO-10303-21 (IFC) e Instruções Técnicas do Corpo de Bombeiros.
          </p>
        </div>
      </footer>

    </div>
  );
}
