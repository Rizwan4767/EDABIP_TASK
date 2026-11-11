import { readAuthSession } from "../../auth/utils/authSession.js";
import { readMockSession } from "../../auth/utils/mockSession.js";

const PREFIX = "edabip_profile_prompt_dismissed";

function getSessionStamp() {
  const session = readMockSession() || readAuthSession();
  return session?.authenticatedAt ?? "session";
}

function getPromptKey(user) {
  const id = user?.id || user?.email || "anon";
  return `${PREFIX}:${id}:${getSessionStamp()}`;
}

export function wasProfilePromptDismissed(user) {
  if (typeof window === "undefined" || !user) {
    return false;
  }

  try {
    return window.sessionStorage.getItem(getPromptKey(user)) === "1";
  } catch {
    return false;
  }
}

export function dismissProfilePrompt(user) {
  if (typeof window === "undefined" || !user) {
    return;
  }

  try {
    window.sessionStorage.setItem(getPromptKey(user), "1");
  } catch {
    // Storage may be unavailable; in-memory dismiss still closes the modal.
  }
}
