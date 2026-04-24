/**
 * Combat Heal homebrew — WFRP4e integration
 *
 * Discovery (tasks 1.1 / 1.2):
 * - Hook: `createChatMessage` after WFRP4e posts a chat card (`type: "test"`) so `doc.system.testData`
 *   is available and we dedupe via `setFlag` on the message.
 * - Skill: `preData.rollClass === "SkillTest"` and localized name matches `game.i18n.localize("NAME.Heal")`.
 * - Success: `testData.result.outcome === "success"`.
 * - Tested against WFRP4e system id `wfrp4e` (see `system.json` in the system package).
 *
 * GM-only: effects are created on the active GM client so players without OWNER on NPCs still work.
 *
 * Mechanical gap: “healer loses their next action” has no stable ActiveEffect key in WFRP4e 9.5.x;
 * only movement is enforced via `system.details.move.value` OVERRIDE 0. The description still states the full rule.
 */

const MODULE_ID = "wfrp4e-homebrew-qol";

/** @type {string} Must match openspec combat-heal-effects requirement exactly */
const EFFECT_DESCRIPTION =
  "Heal skill used during combat: neither participant may move for two combat rounds; the healer also loses their next action.";

/** @param {ChatMessage} doc */
async function onCreateChatMessage(doc) {
  try {
    if (!game?.user?.isGM) return;
    if (!game?.wfrp4e?.rolls?.TestWFRP) return;
    if (doc.type !== "test") return;
    if (doc.getFlag(MODULE_ID, "healCombatApplied")) return;

    const testData = doc.system?.testData;
    if (!testData || testData.preData?.rollClass !== "SkillTest") return;

    const test = game.wfrp4e.rolls.TestWFRP.recreate(testData);
    if (test.result?.outcome !== "success") return;

    const healLabel = game.i18n.localize("NAME.Heal");
    const skillName = test.item?.name ?? test.preData?.skillName;
    if (skillName !== healLabel) return;

    const combat = game.combat;
    if (!combat) return;

    const source = test.actor;
    if (!source) return;

    const targetActors = (test.targets ?? []).filter(Boolean);
    const target = targetActors.length ? targetActors[0] : source;
    if (targetActors.length > 1) {
      console.warn(
        `${MODULE_ID}: Heal has multiple targets; applying combat penalty only to the first target.`,
      );
    }

    await applyHealCombatPenalties({ source, target, combat, message: doc });
    await doc.setFlag(MODULE_ID, "healCombatApplied", true);
  } catch (err) {
    console.error(`${MODULE_ID} | combat Heal hook`, err);
  }
}

/** @param {{ source: Actor; target: Actor; combat: Combat; message: ChatMessage }} args */
async function applyHealCombatPenalties({ source, target, combat, message }) {
  const OVERRIDE = CONST.ACTIVE_EFFECT_MODES?.OVERRIDE ?? 5;
  const duration = buildEffectDuration(combat);
  const origin = message.uuid ?? source.uuid;

  const base = {
    description: EFFECT_DESCRIPTION,
    img: "icons/svg/downgrade.svg",
    disabled: false,
    origin,
    duration,
    changes: [
      {
        key: "system.details.move.value",
        mode: OVERRIDE,
        value: 0,
      },
    ],
    flags: { [MODULE_ID]: { healCombatPenalty: true, messageId: message.id } },
  };

  if (source.uuid === target.uuid) {
    await source.createEmbeddedDocuments("ActiveEffect", [
      {
        ...base,
        name: `Heal (combat) — ${source.name}`,
      },
    ]);
    return;
  }

  await source.createEmbeddedDocuments("ActiveEffect", [
    {
      ...base,
      name: `Heal (combat) — ${source.name}`,
      origin,
    },
  ]);

  await target.createEmbeddedDocuments("ActiveEffect", [
    {
      ...base,
      name: `Heal (combat) — ${target.name}`,
      origin,
    },
  ]);
}

/** @param {Combat} combat */
function buildEffectDuration(combat) {
  const round = combat.round ?? 1;
  const turn = combat.turn ?? 0;
  const gen = game.release?.generation ?? 13;

  if (gen >= 14) {
    return {
      combat: combat.id,
      startRound: round,
      startTurn: turn,
      units: "rounds",
      value: 2,
    };
  }

  return {
    combat: combat.id,
    rounds: 2,
    startRound: round,
    startTurn: turn,
  };
}

export function registerCombatHealEffects() {
  Hooks.on("createChatMessage", onCreateChatMessage);
}
