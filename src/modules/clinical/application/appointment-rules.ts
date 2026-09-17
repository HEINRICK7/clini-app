export type NextStep = "completed" | "return" | "continue";

export function buildEvolutionContent({ context, observations, procedures, nextStep, returnDays }: { context: string; observations: string; procedures: string[]; nextStep: NextStep; returnDays: string }) {
  const nextLabel = nextStep === "completed" ? "Tratamento concluído" : nextStep === "continue" ? "Continuar tratamento" : `Retorno em ${returnDays || "30"} dias`;
  return [`Motivo / contexto:\n${context}`, procedures.length ? `Procedimentos:\n${procedures.map((procedure) => `- ${procedure}`).join("\n")}` : "Procedimentos:\nNenhum procedimento selecionado.", `Observações:\n${observations || "Nenhuma observação adicional."}`, `Próximo passo:\n${nextLabel}`].join("\n\n");
}
