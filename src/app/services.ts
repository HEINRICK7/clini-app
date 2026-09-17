import { authGateway } from "@/modules/auth/infrastructure/auth-gateway";
import * as authApi from "@/modules/auth/api";
import * as audit from "@/modules/audit/api";
import * as catalog from "@/modules/catalog/api";
import * as clinical from "@/modules/clinical/api";
import * as clinicalAttachments from "@/modules/clinical/attachment-api";
import * as clinicalDocuments from "@/modules/clinical/document-api";
import * as clinicalOdontograms from "@/modules/clinical/odontogram-api";
import * as clinicalPrescriptions from "@/modules/clinical/prescription-api";
import * as clinicalSignatures from "@/modules/clinical/signature-api";
import * as clinicalTreatments from "@/modules/clinical/treatment-api";
import { dashboardGateway } from "@/modules/dashboard/infrastructure/dashboard-gateway";
import * as finance from "@/modules/finance/api";
import * as financeBudgets from "@/modules/finance/budget-api";
import * as notifications from "@/modules/notifications/api";
import * as patient from "@/modules/patient/api";
import * as practice from "@/modules/practice/api";
import * as privacy from "@/modules/privacy/api";
import * as scheduling from "@/modules/scheduling/api";

/**
 * Composition root for browser-side application services.
 *
 * Presentation components consume this contract through the provider instead
 * of importing HTTP adapters directly. This keeps replacement seams explicit
 * and gives tests a single place to inject fakes.
 */
export const cliniServices = {
  auth: { ...authApi, ...authGateway },
  audit,
  catalog,
  clinical,
  clinicalAttachments,
  clinicalDocuments,
  clinicalOdontograms,
  clinicalPrescriptions,
  clinicalSignatures,
  clinicalTreatments,
  dashboard: dashboardGateway,
  finance,
  financeBudgets,
  notifications,
  patient,
  practice,
  privacy,
  scheduling,
} as const;

export type CliniServices = typeof cliniServices;

export type { AuditEntry } from "@/modules/audit/api";
export type { CatalogProcedure } from "@/modules/catalog/api";
export type { ClinicalAppointmentCompletion, ClinicalEvolution } from "@/modules/clinical/api";
export type { ClinicalAttachment } from "@/modules/clinical/attachment-api";
export type { ClinicalDocument, ClinicalDocumentType } from "@/modules/clinical/document-api";
export type { Odontogram, OdontogramDentition, OdontogramFindingType, OdontogramSurface, OdontogramTooth, OdontogramToothInput, OdontogramToothStatus } from "@/modules/clinical/odontogram-api";
export type { Prescription, PrescriptionItemInput } from "@/modules/clinical/prescription-api";
export type { QualifiedSignatureRequest } from "@/modules/clinical/signature-api";
export type { PlannedProcedure, PerformedProcedure, Treatment } from "@/modules/clinical/treatment-api";
export type { FinancialEntry, FinancialStatus, FinancialType, PaymentMethod } from "@/modules/finance/api";
export type { Budget, BudgetPaymentMethod, BudgetStatus } from "@/modules/finance/budget-api";
export type { Patient, PatientDraft } from "@/modules/patient/api";
export type { Unit, UnitDraft } from "@/modules/practice/api";
export type { Appointment } from "@/modules/scheduling/api";
export type { Notification } from "@/modules/notifications/api";
export type { PrivacyRequest, PrivacyRequestStatus, PrivacyRequestType } from "@/modules/privacy/api";
