import "server-only";
import { properties } from "./properties";
import { createLocalRepository } from "./local-repository";
import { validateEnvironment } from "@/lib/environment";
validateEnvironment({
  APP_MODE: process.env.APP_MODE,
  PROPERTY_DATA_SOURCE: process.env.PROPERTY_DATA_SOURCE,
});
export const propertyRepository = createLocalRepository(async () => properties);
