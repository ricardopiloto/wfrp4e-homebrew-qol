import { registerCombatHealEffects } from "./combat-heal-effects.mjs";
import {
  registerFastOutOfTurnHooks,
  registerFastOutOfTurnSettings,
} from "./fast-out-of-turn.mjs";

const MODULE_ID = "wfrp4e-homebrew-qol";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  if (game.system?.id === "wfrp4e") registerFastOutOfTurnSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);
  if (game.system?.id === "wfrp4e") {
    registerCombatHealEffects();
    registerFastOutOfTurnHooks();
  }
});
