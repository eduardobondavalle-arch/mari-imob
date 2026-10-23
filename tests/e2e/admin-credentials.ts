export function adminCredentials() {
  const password =
    process.env.TEST_ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD;
  if (!password)
    throw new Error(
      "Defina TEST_ADMIN_PASSWORD ou INITIAL_ADMIN_PASSWORD para executar o E2E administrativo.",
    );
  return {
    email:
      process.env.TEST_ADMIN_EMAIL ||
      process.env.INITIAL_ADMIN_EMAIL ||
      "mari@admin.com.br",
    password,
  };
}
