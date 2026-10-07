import { describe, expect, it } from "vitest";

import {
  appointmentStatusLabel,
  auditActionLabel,
  auditResourceLabel,
  clinicalRecordStatusLabel,
  plannedProcedureStatusLabel,
  privacyRequestStatusLabel,
  privacyRequestTypeLabel,
  treatmentStatusLabel,
} from "@/lib/ui-labels";

describe("labels shown to clinicians", () => {
  it("translates clinical workflow statuses", () => {
    expect(treatmentStatusLabel("ACTIVE")).toBe("Em andamento");
    expect(plannedProcedureStatusLabel("IN_PROGRESS")).toBe("Em andamento");
    expect(clinicalRecordStatusLabel("DRAFT")).toBe("Rascunho");
    expect(clinicalRecordStatusLabel("CLOSED")).toBe("Fechado");
    expect(appointmentStatusLabel("CONFIRMED")).toBe("Confirmado");
  });

  it("translates privacy request labels and audit events", () => {
    expect(privacyRequestTypeLabel("ANONYMIZATION_REVIEW")).toBe("Avaliação de anonimização");
    expect(privacyRequestStatusLabel("IN_REVIEW")).toBe("Em análise");
    expect(auditActionLabel("CLINICAL_DOCUMENT_RECTIFIED")).toBe("Documento clínico retificado");
    expect(auditResourceLabel("CLINICAL_ATTACHMENT")).toBe("Anexo clínico");
  });

  it("does not expose unknown backend values", () => {
    expect(treatmentStatusLabel("NEW_INTERNAL_STATE")).toBe("Situação atualizada");
    expect(auditActionLabel("NEW_INTERNAL_ACTION")).toBe("Ação registrada");
  });
});
