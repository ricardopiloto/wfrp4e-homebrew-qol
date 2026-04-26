/**
 * Fast weapon quality — out-of-initiative attack reminder (WFRP4e)
 *
 * Discovery:
 * - Chat card `type: "test"` carries `system.testData`; `preData.rollClass === "WeaponTest"` for weapon attacks.
 * - Fast quality on the rolled weapon: `item.properties?.qualities?.fast` (see WFRP4e weapon opposed logic).
 * - Turn check: compare `game.combat.combatant` token/actor to the test speaker token / actor.
 * - Duration: through end of current combat round; `preUpdateCombat` removes module-flagged effects when `round` **increments** (avoids false positives from `round` appearing in unrelated diffs).
 *
 * GM-only creation (same pattern as combat-heal-effects).
 */

const MODULE_ID = "wfrp4e-homebrew-qol";
const SETTING_KEY = "trackFastOutOfTurn";
const DEBUG_SETTING_KEY = "debugCombatAutomations";

/** Must match openspec `weapon-fast-out-of-turn` exactly */
const FAST_EFFECT_DESCRIPTION =
  "Used the Fast weapon quality and acted out of turn; only movement is allowed for the remainder of the turn.";

export function registerFastOutOfTurnSettings() {
  game.settings.register(MODULE_ID, SETTING_KEY, {
    name: "Track Fast weapon attacks out of turn",
    hint: "When enabled, a weapon attack using a Fast weapon during someone else's turn in combat adds a Fast Active Effect to the attacker (GM applies).",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
}

function isDebugEnabled() {
  return Boolean(game.settings.get(MODULE_ID, DEBUG_SETTING_KEY));
}

function debugLog(feature, label, data) {
  if (!isDebugEnabled()) return;
  const payload = data ? { ...data } : undefined;
  console.log(`${MODULE_ID} | debug | ${feature} | ${label}`, payload ?? "");
}

/** @param {ChatMessage} doc */
async function onCreateChatMessage(doc) {
  try {
    if (!game.settings.get(MODULE_ID, SETTING_KEY)) {
      debugLog("Fast", "guard: settingOff", { messageId: doc?.id, type: doc?.type });
      return;
    }
    if (!game?.user?.isGM) {
      debugLog("Fast", "guard: notGM", { messageId: doc?.id });
      return;
    }
    if (!game?.wfrp4e?.rolls?.TestWFRP) {
      debugLog("Fast", "guard: missingTestWFRP", { messageId: doc?.id });
      return;
    }
    if (doc.type !== "test") {
      debugLog("Fast", "guard: wrongMessageType", { messageId: doc?.id, type: doc?.type });
      return;
    }
    if (doc.getFlag(MODULE_ID, "fastOutOfTurnApplied")) {
      debugLog("Fast", "guard: alreadyAppliedFlag", { messageId: doc?.id });
      return;
    }

    const testData = doc.system?.testData;
    const rollClass = testData?.preData?.rollClass;
    if (!testData) {
      debugLog("Fast", "guard: missingTestData", { messageId: doc?.id });
      return;
    }
    if (rollClass !== "WeaponTest") {
      debugLog("Fast", "guard: wrongRollClass", { messageId: doc?.id, rollClass });
      return;
    }

    const test = game.wfrp4e.rolls.TestWFRP.recreate(testData);
    const combat = game.combat;
    if (!combat) {
      debugLog("Fast", "guard: missingCombat", { messageId: doc?.id });
      return;
    }

    const hasFast = weaponHasFast(test.item);
    if (!hasFast) {
      debugLog("Fast", "guard: weaponNotFast", {
        messageId: doc?.id,
        itemName: test?.item?.name,
        itemId: test?.item?.id,
      });
      return;
    }

    const outOfTurn = isAttackerOutOfTurn(combat, test);
    debugLog("Fast", "decision: outOfTurnComputed", {
      messageId: doc?.id,
      rollClass,
      combatId: combat.id,
      combatRound: combat.round,
      combatTurn: combat.turn,
      currentCombatantTokenId: combat.combatant?.token?.id,
      currentCombatantActorUuid: combat.combatant?.actor?.uuid,
      attackerTokenId: test?.token?.id,
      attackerActorUuid: test?.actor?.uuid,
      weaponHasFast: hasFast,
      outOfTurn,
    });
    if (!outOfTurn) {
      debugLog("Fast", "guard: attackerNotOutOfTurn", { messageId: doc?.id });
      return;
    }

    const baseAttacker = test.actor;
    const attackToken = test.token;
    const tokenDoc = attackToken?.document ?? attackToken;
    const isUnlinkedToken = Boolean(tokenDoc && tokenDoc.actorLink === false);
    const tokenAttacker = attackToken?.actor;
    const attacker = isUnlinkedToken ? tokenAttacker : baseAttacker;
    if (!attacker) {
      debugLog("Fast", "guard: missingAttackerActor", { messageId: doc?.id });
      return;
    }

    debugLog("Fast", "decision: effectTargetResolved", {
      messageId: doc?.id,
      baseAttackerUuid: baseAttacker?.uuid,
      tokenId: attackToken?.id,
      tokenAttackerUuid: tokenAttacker?.uuid,
      tokenActorLink: tokenDoc?.actorLink,
      isUnlinkedToken,
      effectTargetUuid: attacker.uuid,
      effectTargetIsToken: attacker.isToken ?? undefined,
    });

    const duration = buildFastEffectDuration(combat);
    const origin = doc.uuid ?? attacker.uuid;
    const startRound = combat.round ?? 1;

    debugLog("Fast", "action: createEffectAttempt", {
      messageId: doc?.id,
      attackerActorUuid: attacker.uuid,
      combatId: combat.id,
      startRound,
      durationSeconds: duration?.seconds,
      durationRounds: duration?.rounds,
      durationTurns: duration?.turns,
    });
    const created = await attacker.createEmbeddedDocuments("ActiveEffect", [
      {
        name: "Fast",
        description: FAST_EFFECT_DESCRIPTION,
        img: "icons/svg/thrust.svg",
        disabled: false,
        origin,
        duration,
        changes: [],
        flags: {
          [MODULE_ID]: {
            fastOutOfTurn: true,
            messageId: doc.id,
            fastOutOfTurnStartRound: startRound,
            fastOutOfTurnCombatId: combat.id,
          },
        },
      },
    ]);
    debugLog("Fast", "action: createEffectSuccess", {
      messageId: doc?.id,
      createdCount: created?.length ?? 0,
      createdEffectIds: Array.isArray(created) ? created.map((e) => e?.id).filter(Boolean) : [],
    });
    if (Array.isArray(created) && created.length) {
      const firstId = created[0]?.id;
      debugLog("Fast", "verify: createdEffectPresent", {
        messageId: doc?.id,
        effectTargetUuid: attacker.uuid,
        effectTargetIsToken: attacker.isToken ?? undefined,
        effectId: firstId,
        present: Boolean(firstId && attacker.effects?.get(firstId)),
      });
    }

    await doc.setFlag(MODULE_ID, "fastOutOfTurnApplied", true);
    debugLog("Fast", "action: setFlagSuccess", { messageId: doc?.id });
  } catch (err) {
    debugLog("Fast", "error: exception", { messageId: doc?.id, error: err });
    console.error(`${MODULE_ID} | Fast out-of-turn hook`, err);
  }
}

/** @param {Item | null | undefined} item */
function weaponHasFast(item) {
  if (!item) return false;
  if (item.properties?.qualities?.fast) return true;
  const sys = item.system;
  if (sys?.qualities?.fast) return true;
  if (sys?.properties?.qualities?.fast) return true;
  return false;
}

/** “Out of turn” = current combatant is not the attacking token (or not the same actor when tokens missing). */
function isAttackerOutOfTurn(combat, test) {
  const current = combat.combatant;
  if (!current) return false;

  const attackTok = test.token;
  const curTok = current.token;
  if (attackTok && curTok) return attackTok.id !== curTok.id;

  const a = test.actor;
  const curActor = current.actor;
  if (a && curActor) return a.uuid !== curActor.uuid;

  return false;
}

/**
 * Link effect to combat for UI; omit `rounds` / `units`+`value` so core does not clear it at the next turn index.
 * Removal is handled in `removeExpiredFastOutOfTurnEffectsForCombat` (real round increment via `preUpdateCombat`) and `removeAllFastOutOfTurnEffectsForCombatId` (combat deleted).
 * @param {Combat} combat
 */
function buildFastEffectDuration(combat) {
  const round = combat.round ?? 1;
  const turn = combat.turn ?? 0;
  const gen = game.release?.generation ?? 13;
  const seconds = 60 * 60;

  if (gen >= 14) {
    return {
      combat: combat.id,
      startRound: round,
      startTurn: turn,
      seconds,
    };
  }

  return {
    combat: combat.id,
    startRound: round,
    startTurn: turn,
    seconds,
  };
}

/**
 * @param {Combat} combat
 * @param {number} currentRound
 */
async function removeExpiredFastOutOfTurnEffectsForCombat(combat, currentRound) {
  const combatId = combat.id;
  for (const actor of game.actors ?? []) {
    if (!actor?.effects?.size) continue;
    const ids = actor.effects
      .filter((e) => {
        if (!e.getFlag(MODULE_ID, "fastOutOfTurn")) return false;
        if (e.getFlag(MODULE_ID, "fastOutOfTurnCombatId") !== combatId) return false;
        const start = e.getFlag(MODULE_ID, "fastOutOfTurnStartRound");
        return typeof start === "number" && start < currentRound;
      })
      .map((e) => e.id);
    if (ids.length) {
      debugLog("Fast", "cleanup: roundIncrementDelete", {
        combatId,
        currentRound,
        actorUuid: actor.uuid,
        effectIds: ids,
      });
      await actor.deleteEmbeddedDocuments("ActiveEffect", ids);
    }
  }
}

/** @param {string} combatId */
async function removeAllFastOutOfTurnEffectsForCombatId(combatId) {
  for (const actor of game.actors ?? []) {
    if (!actor?.effects?.size) continue;
    const ids = actor.effects
      .filter(
        (e) =>
          e.getFlag(MODULE_ID, "fastOutOfTurn") &&
          e.getFlag(MODULE_ID, "fastOutOfTurnCombatId") === combatId,
      )
      .map((e) => e.id);
    if (ids.length) {
      debugLog("Fast", "cleanup: deleteCombatDelete", {
        combatId,
        actorUuid: actor.uuid,
        effectIds: ids,
      });
      await actor.deleteEmbeddedDocuments("ActiveEffect", ids);
    }
  }
}

/**
 * Only run when the combat **round** is about to increase (`changed.round` > current `combat.round`).
 * Using `preUpdateCombat` keeps `combat.round` as the **old** value so we do not treat turn-only updates as round changes.
 * @param {Combat} combat
 * @param {object} changed
 */
function onPreUpdateCombatForFastOutOfTurn(combat, changed) {
  try {
    if (!game.settings.get(MODULE_ID, SETTING_KEY)) return;
    if (!game?.user?.isGM) return;
    if (!combat || !("round" in changed)) return;
    const oldRound = combat.round ?? 1;
    const newRound = Number(changed.round);
    if (!Number.isFinite(newRound) || newRound <= oldRound) return;
    void removeExpiredFastOutOfTurnEffectsForCombat(combat, newRound);
  } catch (err) {
    console.error(`${MODULE_ID} | Fast out-of-turn round cleanup`, err);
  }
}

/** @param {Combat} combat */
function onDeleteCombatForFastOutOfTurn(combat) {
  try {
    if (!game?.user?.isGM) return;
    void removeAllFastOutOfTurnEffectsForCombatId(combat.id);
  } catch (err) {
    console.error(`${MODULE_ID} | Fast out-of-turn deleteCombat cleanup`, err);
  }
}

export function registerFastOutOfTurnHooks() {
  Hooks.on("createChatMessage", onCreateChatMessage);
  Hooks.on("preUpdateCombat", onPreUpdateCombatForFastOutOfTurn);
  Hooks.on("deleteCombat", onDeleteCombatForFastOutOfTurn);
}
