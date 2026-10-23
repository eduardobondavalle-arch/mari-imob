type InitialAdminEnvironment = Record<string, string | undefined>;

export function initialAdminCredentials(
  environment: InitialAdminEnvironment = process.env,
) {
  const email = (environment.INITIAL_ADMIN_EMAIL || "mari@admin.com.br")
    .trim()
    .toLowerCase();
  const password = environment.INITIAL_ADMIN_PASSWORD;

  if (!password || password === "Admin" || password.length < 12)
    throw new Error(
      "Defina INITIAL_ADMIN_PASSWORD com pelo menos 12 caracteres antes de executar o seed.",
    );
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Defina INITIAL_ADMIN_EMAIL com um endereço válido.");

  return { email, password };
}
