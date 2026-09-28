import "server-only";

import path from "node:path";
import puppeteer, { type Browser, type LaunchOptions } from "puppeteer";

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const DEBUG_PORT = Number.parseInt(
  process.env.PUPPETEER_DEBUG_PORT ?? "9333",
  10
);

export function puppeteerUserDataDir(): string {
  const dir = process.env.PUPPETEER_USER_DATA_DIR ?? ".puppeteer-profile";
  return path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
}

export function isHeadlessMode(forceVisible = false): boolean {
  if (forceVisible) return false;
  return process.env.PUPPETEER_HEADLESS !== "false";
}

export function captchaWaitTimeoutMs(): number {
  const raw = process.env.CAPTCHA_WAIT_TIMEOUT_MS ?? "600000";
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 600_000;
}

export function shouldWaitForManualCaptcha(): boolean {
  return process.env.CAPTCHA_MANUAL_WAIT !== "false";
}

let managedBrowser: Browser | null = null;

function launchOptions(forceVisible: boolean): LaunchOptions {
  const userDataDir = puppeteerUserDataDir();
  const headless = isHeadlessMode(forceVisible);
  return {
    headless,
    userDataDir,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      `--remote-debugging-port=${DEBUG_PORT}`,
    ],
    defaultViewport: headless ? { width: 1366, height: 900 } : null,
  };
}

async function connectToExistingBrowser(): Promise<Browser | null> {
  try {
    return await puppeteer.connect({
      browserURL: `http://127.0.0.1:${DEBUG_PORT}`,
      defaultViewport: null,
    });
  } catch {
    return null;
  }
}

/** Reuse one Chrome instance per dev server — avoids profile lock errors. */
export async function getSearchBrowser(forceVisible = false): Promise<Browser> {
  if (managedBrowser?.connected) {
    return managedBrowser;
  }

  if (managedBrowser && !managedBrowser.connected) {
    managedBrowser = null;
  }

  try {
    managedBrowser = await puppeteer.launch(launchOptions(forceVisible));
    return managedBrowser;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("already running")) {
      const connected = await connectToExistingBrowser();
      if (connected) {
        managedBrowser = connected;
        return connected;
      }
      throw new Error(
        "Chrome profile is locked. Close every “Google Chrome for Testing” / Chrome window opened by this app (Task Manager), then run again — or call POST /api/google/reset-browser."
      );
    }
    throw e;
  }
}

export async function closeManagedBrowser(): Promise<void> {
  if (!managedBrowser) return;
  try {
    await managedBrowser.close();
  } catch {
    /* ignore */
  }
  managedBrowser = null;
}

/** @deprecated use getSearchBrowser */
export async function launchSearchBrowser(
  forceVisible = false
): Promise<Browser> {
  return getSearchBrowser(forceVisible);
}

let browserLock: Promise<void> = Promise.resolve();

export async function withBrowserProfileLock<T>(
  fn: () => Promise<T>
): Promise<T> {
  const prev = browserLock;
  let release!: () => void;
  browserLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}
