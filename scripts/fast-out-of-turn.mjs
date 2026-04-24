/**
 * Fast weapon quality — out-of-initiative attack reminder (WFRP4e)
 *
 * Discovery:
 * - Chat card `type: "test"` carries `system.testData`; `preData.rollClass === "WeaponTest"` for weapon attacks.
 * - Fast quality on the rolled weapon: `item.properties?.qualities?.fast` (see WFRP4e weapon opposed logic).
 * - Turn check: compare `game.combat.combatant` token/actor to the test speaker token / actor.
 * - Duration: one combat round (approximation for “rest of turn” / end-of-round cleanup; see OpenSpec design).
 *
 * GM-only creation (same pattern as combat-heal-effects).
 */

const MODULE_ID = "wfrp4e-homebrew-qol";
const SETTING_KEY = "trackFastOutOfTurn";

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

/** @param {ChatMessage} doc */
async function onCreateChatMessage(doc) {
  try {
    if (!game.settings.get(MODULE_ID, SETTING_KEY)) return;
    if (!game?.user?.isGM) return;
    if (!game?.wfrp4e?.rolls?.TestWFRP) return;
    if (doc.type !== "test") return;
    if (doc.getFlag(MODULE_ID, "fastOutOfTurnApplied")) return;

    const testData = doc.system?.testData;
    if (!testData || testData.preData?.rollClass !== "WeaponTest") return;

    const test = game.wfrp4e.rolls.TestWFRP.recreate(testData);
    const combat = game.combat;
    if (!combat?.started) return;

    if (!test.item?.properties?.qualities?.fast) return;

    if (!isAttackerOutOfTurn(combat, test)) return;

    const attacker = test.actor;
    if (!attacker) return;

    const duration = buildOneRoundDuration(combat);
    const origin = doc.uuid ?? attacker.uuid;

    await attacker.createEmbeddedDocuments("ActiveEffect", [
      {
        name: "Fast",
        description: FAST_EFFECT_DESCRIPTION,
        img: "icons/svg/upgrade.svg",
        disabled: false,
        origin,
        duration,
        changes: [],
        flags: { [MODULE_ID]: { fastOutOfTurn: true, messageId: doc.id } },
      },
    ]);

    await doc.setFlag(MODULE_ID, "fastOutOfTurnApplied", true);
  } catch (err) {
    console.error(`${MODULE_ID} | Fast out-of-turn hook`, err);
  }
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

/** @param {Combat} combat */
function buildOneRoundDuration(combat) {
  const round = combat.round ?? 1;
  const turn = combat.turn ?? 0;
  const gen = game.release?.generation ?? 13;

  if (gen >= 14) {
    return {
      combat: combat.id,
      startRound: round,
      startTurn: turn,
      units: "rounds",
      value: 1,
    };
  }

  return {
    combat: combat.id,
    rounds: 1,
    startRound: round,
    startTurn: turn,
  };
}

export function registerFastOutOfTurnHooks() {
  Hooks.on("createChatMessage", onCreateChatMessage);
}
