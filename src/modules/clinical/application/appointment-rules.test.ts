import { describe, expect, it } from "vitest";

import { buildEvolutionContent } from "./appointment-rules";

describe("appointment evolution rules", () => {
  it("builds a stable clinical evolution summary from the flow answers", () => {
    expect(buildEvolutionContent({ context: "Dor no molar", observations: "Sem edema", procedures: ["Avaliação"], nextStep: "return", returnDays: "30" })).toBe("Motivo / contexto:\nDor no molar\n\nProcedimentos:\n- Avaliação\n\nObservações:\nSem edema\n\nPróximo passo:\nRetorno em 30 dias");
  });

  it("uses explicit fallbacks for optional answers", () => {
    expect(buildEvolutionContent({ context: "Avaliação", observations: "", procedures: [], nextStep: "completed", returnDays: "" })).toContain("Nenhuma observação adicional.");
    expect(buildEvolutionContent({ context: "Avaliação", observations: "", procedures: [], nextStep: "return", returnDays: "" })).toContain("Retorno em 30 dias");
  });
});
