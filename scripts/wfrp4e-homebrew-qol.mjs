import {
  registerCombatHealEffects,
  registerCombatHealSettings,
} from "./combat-heal-effects.mjs";
import {
  registerFastOutOfTurnHooks,
  registerFastOutOfTurnSettings,
} from "./fast-out-of-turn.mjs";
import {
  registerEndOfRoundSideCountHooks,
  registerEndOfRoundSideCountSettings,
} from "./end-of-round-side-count.mjs";

const MODULE_ID = "wfrp4e-homebrew-qol";
const DEBUG_SETTING_KEY = "debugCombatAutomations";

function registerDebugCombatAutomationSettings() {
  game.settings.register(MODULE_ID, DEBUG_SETTING_KEY, {
    name: "Debug combat automations (Fast / Heal)",
    hint: "When enabled, prints detailed console logs explaining why Fast/Heal effects were or were not created (GM troubleshooting).",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
}

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  if (game.system?.id === "wfrp4e") {
    registerFastOutOfTurnSettings();
    registerCombatHealSettings();
    registerDebugCombatAutomationSettings();
    registerEndOfRoundSideCountSettings();
  }
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);
  if (game.system?.id === "wfrp4e") {
    registerCombatHealEffects();
    registerFastOutOfTurnHooks();
    registerEndOfRoundSideCountHooks();
  }
});
