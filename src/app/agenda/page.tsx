import { OperationalShell } from "@/app/operational-shell";
import { AgendaWorkspace } from "@/modules/scheduling/components/agenda-workspace";

export default function AgendaPage() {
  return <OperationalShell><AgendaWorkspace /></OperationalShell>;
}
