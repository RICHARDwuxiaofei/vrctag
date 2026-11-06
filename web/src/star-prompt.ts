// SPDX-License-Identifier: MIT
// Show the optional support request only once per browser-tab session.
export const STAR_PROMPT_SESSION_KEY = "vrc-tag-studio-star-prompt-v1";
export function takeStarPromptOpportunity(
  storage?: Pick<Storage, "getItem" | "setItem">,
): boolean {
  try {
    if (storage?.getItem(STAR_PROMPT_SESSION_KEY) === "shown") return false;
    storage?.setItem(STAR_PROMPT_SESSION_KEY, "shown");
  } catch {
    // Private browsing can block storage; the UI also guards within the page.
  }
  return true;
}
