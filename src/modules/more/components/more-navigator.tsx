"use client";

import { useState, type ComponentType } from "react";
import { ArrowLeft, Bell, ChevronRight, ClipboardPenLine, FileText, ListChecks, MapPin, Paperclip, Pill, ReceiptText, ScrollText, Settings, ShieldCheck, Smile, Stethoscope, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuditWorkspace } from "@/modules/audit/components/audit-workspace";
import { CatalogWorkspace } from "@/modules/catalog/components/catalog-workspace";
import { ClinicalAttachmentWorkspace } from "@/modules/clinical/components/clinical-attachment-workspace";
import { ClinicalDocumentWorkspace } from "@/modules/clinical/components/clinical-document-workspace";
import { ClinicalRecordWorkspace } from "@/modules/clinical/components/clinical-record-workspace";
import { OdontogramWorkspace } from "@/modules/clinical/components/odontogram-workspace";
import { PrescriptionWorkspace } from "@/modules/clinical/components/prescription-workspace";
import { TreatmentWorkspace } from "@/modules/clinical/components/treatment-workspace";
import { BudgetWorkspace } from "@/modules/finance/components/budget-workspace";
import { FinanceWorkspace } from "@/modules/finance/components/finance-workspace";
import { NotificationWorkspace } from "@/modules/notifications/components/notification-workspace";
import { PrivacyWorkspace } from "@/modules/privacy/components/privacy-workspace";
import { UnitWorkspace } from "@/modules/practice/components/unit-workspace";
import { SettingsWorkspace } from "@/modules/settings/components/settings-workspace";

type Section = "menu" | "units" | "records" | "treatments" | "odontogram" | "documents" | "prescriptions" | "attachments" | "catalog" | "finance" | "budgets" | "privacy" | "notifications" | "audit" | "settings";
type MenuIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const items: Array<{ id: Exclude<Section, "menu">; label: string; icon: MenuIcon }> = [
  { id: "units", label: "Locais de atendimento", icon: MapPin },
  { id: "records", label: "Evoluções (Prontuário)", icon: ClipboardPenLine },
  { id: "treatments", label: "Tratamentos", icon: Stethoscope },
  { id: "odontogram", label: "Odontograma", icon: Smile },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "prescriptions", label: "Prescrições", icon: Pill },
  { id: "attachments", label: "Anexos clínicos", icon: Paperclip },
  { id: "catalog", label: "Procedimentos (Catálogo)", icon: ListChecks },
  { id: "finance", label: "Financeiro", icon: WalletCards },
  { id: "budgets", label: "Orçamentos", icon: ReceiptText },
  { id: "privacy", label: "Privacidade", icon: ShieldCheck },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "audit", label: "Auditoria", icon: ScrollText },
  { id: "settings", label: "Configurações", icon: Settings },
];

export function MoreNavigator() {
  const [section, setSection] = useState<Section>("menu");
  const currentItem = items.find((item) => item.id === section);

  if (section !== "menu" && currentItem) return <section className="grid gap-4"><div className="flex items-center gap-2"><Button aria-label="Voltar para Mais" className="h-11 w-11 px-0" onClick={() => setSection("menu")} size="sm" variant="ghost"><ArrowLeft aria-hidden={true} className="h-5 w-5" /></Button><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Mais</p><h1 className="text-xl font-bold tracking-tight text-brand-navy">{currentItem.label}</h1></div></div><WorkspaceSection section={section} /></section>;

  return <section className="mx-auto w-full max-w-2xl"><div className="mb-4"><p className="text-sm font-semibold text-primary">Seu espaço de trabalho</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-navy">Mais</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Acesse os recursos clínicos, operacionais e de gestão.</p></div><div className="overflow-hidden rounded-2xl border border-border bg-surface">{items.map(({ id, label, icon: Icon }) => <button className="flex min-h-16 w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-muted focus-visible:bg-surface-muted" key={id} onClick={() => setSection(id)} type="button"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand-navy"><Icon aria-hidden={true} className="h-5 w-5" /></span><span className="flex-1 text-sm font-semibold text-foreground">{label}</span><ChevronRight aria-hidden={true} className="h-4 w-4 text-muted-foreground" /></button>)}</div></section>;
}

function WorkspaceSection({ section }: { section: Exclude<Section, "menu"> }) {
  switch (section) {
    case "units": return <UnitWorkspace />;
    case "records": return <ClinicalRecordWorkspace />;
    case "treatments": return <TreatmentWorkspace />;
    case "odontogram": return <OdontogramWorkspace />;
    case "documents": return <ClinicalDocumentWorkspace />;
    case "prescriptions": return <PrescriptionWorkspace />;
    case "attachments": return <ClinicalAttachmentWorkspace />;
    case "catalog": return <CatalogWorkspace />;
    case "finance": return <FinanceWorkspace />;
    case "budgets": return <BudgetWorkspace />;
    case "privacy": return <PrivacyWorkspace />;
    case "notifications": return <NotificationWorkspace />;
    case "audit": return <AuditWorkspace />;
    case "settings": return <SettingsWorkspace />;
  }
}
