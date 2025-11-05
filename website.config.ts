// Website Configuration
import type { AppConfig } from "./src/types/config";
import configJson from "./website.config.json";

// Load configuration from JSON file
export const websiteConfig: AppConfig = configJson as AppConfig;
