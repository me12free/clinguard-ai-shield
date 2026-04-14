import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Ensures Laravel schema + seed data (including demo users) exist before E2E.
 * Skip with PLAYWRIGHT_SKIP_DB_PREP=1 if you manage the DB yourself.
 */
export default async function globalSetup(): Promise<void> {
  if (process.env.PLAYWRIGHT_SKIP_DB_PREP) {
    return;
  }
  const cwd = path.join(process.cwd(), "laravel-backend");
  execSync("php artisan migrate --force --no-interaction", { cwd, stdio: "inherit" });
  execSync("php artisan db:seed --force --no-interaction", { cwd, stdio: "inherit" });
}
