// SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { STAR_PROMPT_SESSION_KEY, takeStarPromptOpportunity } from "../src/star-prompt.ts";

test("the GitHub Star request appears only once per tab session", () => {
  const entries = new Map<string, string>();
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value); },
  };
  assert.equal(takeStarPromptOpportunity(storage), true);
  assert.equal(entries.get(STAR_PROMPT_SESSION_KEY), "shown");
  assert.equal(takeStarPromptOpportunity(storage), false);
  // A new tab session may offer the request again.
  assert.equal(takeStarPromptOpportunity({ getItem: () => null, setItem: () => {} }), true);
});

test("blocking browser storage does not prevent the optional request", () => {
  const blocked = {
    getItem: (_key: string): string | null => { throw Error("blocked"); },
    setItem: (_key: string, _value: string) => { throw Error("blocked"); },
  };
  assert.equal(takeStarPromptOpportunity(blocked), true);
  assert.equal(takeStarPromptOpportunity(undefined), true);
});
