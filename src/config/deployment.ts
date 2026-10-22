type DeploymentEnv = {
  [key: string]: string | undefined;
  APP_ENV?: string;
  VERCEL_ENV?: string;
};

/** True only for the public production deployment, never for Vercel previews. */
export function isProductionDeployment(env: DeploymentEnv = process.env) {
  if (env.VERCEL_ENV !== undefined)
    return env.VERCEL_ENV === "production";
  return env.APP_ENV === "production";
}
