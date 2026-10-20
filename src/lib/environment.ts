export function validateEnvironment(env: {
  APP_MODE?: string;
  PROPERTY_DATA_SOURCE?: string;
}) {
  const mode = env.APP_MODE || "demo",
    source = env.PROPERTY_DATA_SOURCE || "local";
  if (!["demo", "live"].includes(mode))
    throw new Error("APP_MODE deve ser demo ou live.");
  if (source !== "local")
    throw new Error(
      "O adaptador da API ainda não foi configurado. Use PROPERTY_DATA_SOURCE=local para a demonstração.",
    );
  if (mode === "live")
    throw new Error(
      "Não é permitido publicar dados demonstrativos no modo live.",
    );
  return { mode, source };
}
