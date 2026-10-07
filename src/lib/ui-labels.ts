const treatmentStatuses: Record<string, string> = {
  PLANNED: "Planejado",
  ACTIVE: "Em andamento",
  PAUSED: "Pausado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};

const plannedProcedureStatuses: Record<string, string> = {
  PLANNED: "Planejado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};

const clinicalRecordStatuses: Record<string, string> = {
  DRAFT: "Rascunho",
  CLOSED: "Fechado",
  ARCHIVED: "Arquivado",
};

const appointmentStatuses: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};

const appointmentTypes: Record<string, string> = {
  CONSULTATION: "Consulta",
  RETURN: "Retorno",
  WALK_IN: "Encaixe",
  URGENT: "Urgência",
};

const qualifiedSignatureStatuses: Record<string, string> = {
  READY: "Pronta para assinatura",
  SUBMITTED: "Enviada para assinatura",
  SIGNED: "Assinada",
  DECLINED: "Recusada",
  EXPIRED: "Expirada",
  CANCELED: "Cancelada",
};

const privacyRequestTypes: Record<string, string> = {
  ACCESS: "Acesso aos dados",
  RECTIFICATION: "Correção de dados",
  ANONYMIZATION_REVIEW: "Avaliação de anonimização",
  DELETION_REVIEW: "Avaliação de eliminação",
};

const privacyRequestStatuses: Record<string, string> = {
  OPEN: "Aberta",
  IN_REVIEW: "Em análise",
  COMPLETED: "Concluída",
  REJECTED: "Rejeitada",
  CANCELED: "Cancelada",
};

const auditActions: Record<string, string> = {
  AUDIT_LOG_VIEWED: "Histórico consultado",
  DASHBOARD_VIEWED: "Painel consultado",
  PATIENT_DATA_EXPORTED: "Dados do paciente exportados",
  PRIVACY_REQUEST_CREATED: "Solicitação de privacidade registrada",
  PRIVACY_REQUEST_OPEN: "Solicitação de privacidade aberta",
  PRIVACY_REQUEST_IN_REVIEW: "Solicitação de privacidade em análise",
  PRIVACY_REQUEST_COMPLETED: "Solicitação de privacidade concluída",
  PRIVACY_REQUEST_REJECTED: "Solicitação de privacidade rejeitada",
  PRIVACY_REQUEST_CANCELED: "Solicitação de privacidade cancelada",
  PRIVACY_REQUEST_STATUS_CHANGED: "Solicitação de privacidade atualizada",
  CATALOG_PROCEDURE_LISTED: "Catálogo de procedimentos consultado",
  CATALOG_PROCEDURE_CREATED: "Procedimento do catálogo criado",
  CATALOG_PROCEDURE_UPDATED: "Procedimento do catálogo atualizado",
  CATALOG_PROCEDURE_UNIT_CONFIGURED: "Preço ou duração do procedimento atualizados",
  CATALOG_PROCEDURE_ARCHIVED: "Procedimento do catálogo arquivado",
  FINANCIAL_ENTRY_CREATED: "Lançamento financeiro criado",
  FINANCIAL_ENTRY_LISTED: "Livro financeiro consultado",
  FINANCIAL_ENTRY_UPDATED: "Lançamento financeiro atualizado",
  FINANCIAL_ENTRY_SETTLED: "Lançamento financeiro liquidado",
  FINANCIAL_ENTRY_CANCELED: "Lançamento financeiro cancelado",
  FINANCIAL_SUMMARY_VIEWED: "Resumo financeiro consultado",
  BUDGET_LISTED: "Orçamentos consultados",
  BUDGET_CREATED: "Orçamento criado",
  BUDGET_APPROVED: "Orçamento aprovado",
  BUDGET_REJECTED: "Orçamento rejeitado",
  BUDGET_CANCELED: "Orçamento cancelado",
  BUDGET_INSTALLMENT_SETTLED: "Parcela do orçamento liquidada",
  BUDGET_INSTALLMENT_CANCELED: "Parcela do orçamento cancelada",
  CLINICAL_DOCUMENT_LISTED: "Documentos clínicos consultados",
  CLINICAL_DOCUMENT_VIEWED: "Documento clínico consultado",
  CLINICAL_DOCUMENT_CREATED: "Documento clínico criado",
  CLINICAL_DOCUMENT_UPDATED: "Documento clínico atualizado",
  CLINICAL_DOCUMENT_CLOSED: "Documento clínico fechado",
  CLINICAL_DOCUMENT_RECTIFIED: "Documento clínico retificado",
  CLINICAL_DOCUMENT_ARCHIVED: "Documento clínico arquivado",
  CLINICAL_RECORD_LISTED: "Prontuário consultado",
  CLINICAL_RECORD_VIEWED: "Prontuário consultado",
  CLINICAL_EVOLUTION_CREATED: "Evolução clínica registrada",
  CLINICAL_EVOLUTION_UPDATED: "Rascunho da evolução atualizado",
  CLINICAL_EVOLUTION_CLOSED: "Evolução clínica fechada",
  CLINICAL_EVOLUTION_RECTIFIED: "Evolução clínica retificada",
  PRESCRIPTION_LISTED: "Prescrições consultadas",
  PRESCRIPTION_VIEWED: "Prescrição consultada",
  PRESCRIPTION_CREATED: "Prescrição criada",
  PRESCRIPTION_UPDATED: "Prescrição atualizada",
  PRESCRIPTION_CLOSED: "Prescrição fechada",
  PRESCRIPTION_RECTIFIED: "Prescrição retificada",
  PRESCRIPTION_ARCHIVED: "Prescrição arquivada",
  CLINICAL_ATTACHMENT_LISTED: "Anexos clínicos consultados",
  CLINICAL_ATTACHMENT_VIEWED: "Anexo clínico consultado",
  CLINICAL_ATTACHMENT_DOWNLOADED: "Anexo clínico baixado",
  CLINICAL_ATTACHMENT_CREATED: "Anexo clínico enviado",
  CLINICAL_ATTACHMENT_ARCHIVED: "Anexo clínico arquivado",
  TREATMENT_LISTED: "Tratamentos consultados",
  TREATMENT_VIEWED: "Tratamento consultado",
  TREATMENT_CREATED: "Tratamento criado",
  TREATMENT_UPDATED: "Tratamento atualizado",
  TREATMENT_STATUS_CHANGED: "Situação do tratamento atualizada",
  PLANNED_PROCEDURE_LISTED: "Procedimentos planejados consultados",
  PLANNED_PROCEDURE_CREATED: "Procedimento planejado adicionado",
  PLANNED_PROCEDURE_UPDATED: "Procedimento planejado atualizado",
  PLANNED_PROCEDURE_CANCELED: "Procedimento planejado cancelado",
  PERFORMED_PROCEDURE_LISTED: "Procedimentos realizados consultados",
  PERFORMED_PROCEDURE_CREATED: "Procedimento realizado registrado",
  PERFORMED_PROCEDURE_CLOSED: "Procedimento realizado fechado",
  PERFORMED_PROCEDURE_RECTIFIED: "Procedimento realizado retificado",
  ODONTOGRAM_VIEWED: "Odontograma consultado",
  TOOTH_HISTORY_VIEWED: "Histórico do dente consultado",
  ODONTOGRAM_CREATED: "Odontograma criado",
  ODONTOGRAM_VERSION_CREATED: "Odontograma atualizado",
  ODONTOGRAM_ARCHIVED: "Odontograma arquivado",
  TOOTH_CONDITION_REGISTERED: "Condição dental registrada",
  TOOTH_NOTE_REGISTERED: "Observação dental registrada",
  TOOTH_PROCEDURE_REGISTERED: "Procedimento dental registrado",
  TOOTH_PLANNING_ADDED: "Procedimento planejado no dente",
  TOOTH_RECORD_CREATED: "Registro dental adicionado",
  TOOTH_RECORD_UPDATED: "Registro dental atualizado",
  TOOTH_RECORD_ARCHIVED: "Registro dental arquivado",
  QUALIFIED_SIGNATURES_LISTED: "Assinaturas digitais consultadas",
  QUALIFIED_SIGNATURE_REQUESTED: "Documento preparado para assinatura digital",
  QUALIFIED_SIGNATURE_CANCELED: "Assinatura digital cancelada",
  QUALIFIED_SIGNATURE_SUBMITTED: "Documento enviado para assinatura digital",
};

const auditResources: Record<string, string> = {
  AUDIT_LOG: "Histórico de atividades",
  DASHBOARD: "Painel",
  PATIENT: "Paciente",
  PRIVACY_REQUEST: "Solicitação de privacidade",
  CATALOG_PROCEDURE: "Procedimento do catálogo",
  FINANCIAL_ENTRY: "Lançamento financeiro",
  BUDGET: "Orçamento",
  CLINICAL_DOCUMENT: "Documento clínico",
  CLINICAL_EVOLUTION: "Evolução clínica",
  PRESCRIPTION: "Prescrição",
  CLINICAL_ATTACHMENT: "Anexo clínico",
  CLINICAL_TREATMENT: "Tratamento",
  PLANNED_PROCEDURE: "Procedimento planejado",
  PERFORMED_PROCEDURE: "Procedimento realizado",
  ODONTOGRAM: "Odontograma",
  TOOTH_RECORD: "Registro dental",
  QUALIFIED_SIGNATURE: "Assinatura digital",
  QUALIFIED_SIGNATURE_REQUEST: "Solicitação de assinatura digital",
  ADMIN: "Configuração da clínica",
};

function translated(value: string, labels: Record<string, string>, fallback: string) {
  return labels[value] ?? fallback;
}

export const treatmentStatusLabel = (status: string) => translated(status, treatmentStatuses, "Situação atualizada");
export const plannedProcedureStatusLabel = (status: string) => translated(status, plannedProcedureStatuses, "Situação atualizada");
export const clinicalRecordStatusLabel = (status: string) => translated(status, clinicalRecordStatuses, "Situação atualizada");
export const appointmentStatusLabel = (status: string) => translated(status, appointmentStatuses, "Situação atualizada");
export const appointmentTypeLabel = (type: string) => translated(type, appointmentTypes, "Atendimento");
export const qualifiedSignatureStatusLabel = (status: string) => translated(status, qualifiedSignatureStatuses, "Situação atualizada");
export const privacyRequestTypeLabel = (type: string) => translated(type, privacyRequestTypes, "Outro pedido");
export const privacyRequestStatusLabel = (status: string) => translated(status, privacyRequestStatuses, "Situação atualizada");
export const auditActionLabel = (action: string) => translated(action, auditActions, "Ação registrada");
export const auditResourceLabel = (resource: string) => translated(resource, auditResources, "Registro relacionado");
