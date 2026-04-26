const MODULE_ID = "wfrp4e-homebrew-qol";
const SETTING_KEY = "trackEndOfRoundSideCount";
const DRILLED_WEIGHT_SETTING_KEY = "weightSideCountWithDrilled";
const DEBUG_SETTING_KEY = "debugCombatAutomations";

export function registerEndOfRoundSideCountSettings() {
  game.settings.register(MODULE_ID, SETTING_KEY, {
    name: "Track end-of-round side count (Friendly vs Hostile)",
    hint: "When enabled, at the end of each combat round the GM client counts Friendly vs Hostile combatants (Neutral ignored) and stores the result as a combat flag.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MODULE_ID, DRILLED_WEIGHT_SETTING_KEY, {
    name: "Weight side count with Drilled (counts as 2)",
    hint: "When enabled, combatants with the Drilled talent count as 2 when tallying Friendly vs Hostile at end of round (Neutral ignored).",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
}

function isDebugEnabled() {
  return Boolean(game.settings.get(MODULE_ID, DEBUG_SETTING_KEY));
}

function debugLog(label, data) {
  if (!isDebugEnabled()) return;
  const payload = data ? { ...data } : undefined;
  console.log(`${MODULE_ID} | debug | SideCount | ${label}`, payload ?? "");
}

function getCombatantDisposition(combatant) {
  const tokenLike = combatant?.token;
  const doc = tokenLike?.document ?? tokenLike;
  return doc?.disposition;
}

function resolveCombatantActor(combatant) {
  const tokenLike = combatant?.token;
  const token = tokenLike?.object ?? tokenLike;
  return token?.actor ?? combatant?.actor;
}

function getDrilledLabel() {
  const localized = game.i18n?.localize?.("NAME.Drilled");
  if (localized && localized !== "NAME.Drilled") return localized;
  return "Drilled";
}

function actorHasDrilled(actor) {
  if (!actor?.items) return false;
  const drilledLabel = getDrilledLabel();
  return actor.items.some((i) => i?.type === "talent" && i?.name === drilledLabel);
}

function computeSideCount(combat) {
  const FRIENDLY = CONST.TOKEN_DISPOSITIONS?.FRIENDLY ?? 1;
  const HOSTILE = CONST.TOKEN_DISPOSITIONS?.HOSTILE ?? -1;
  const drilledWeightingEnabled = Boolean(
    game.settings.get(MODULE_ID, DRILLED_WEIGHT_SETTING_KEY),
  );

  let friendlyCount = 0;
  let hostileCount = 0;

  for (const c of combat?.combatants ?? []) {
    const disp = getCombatantDisposition(c);
    if (disp !== FRIENDLY && disp !== HOSTILE) continue;

    let w = 1;
    if (drilledWeightingEnabled) {
      const actor = resolveCombatantActor(c);
      if (actorHasDrilled(actor)) w = 2;
    }

    if (disp === FRIENDLY) friendlyCount += w;
    if (disp === HOSTILE) hostileCount += w;
  }

  const winner =
    friendlyCount === hostileCount
      ? "tie"
      : friendlyCount > hostileCount
        ? "friendly"
        : "hostile";

  return { friendlyCount, hostileCount, winner, drilledWeightingEnabled };
}

function clampPool(value, min, max) {
  const n = Number(value) || 0;
  return Math.min(Math.max(n, min), max);
}

async function maybeShiftGroupAdvantagePools({ friendlyCount, hostileCount }) {
  if (!game.settings.get("wfrp4e", "useGroupAdvantage")) return;
  const updateGroupAdvantage = game.wfrp4e?.utility?.updateGroupAdvantage;
  if (typeof updateGroupAdvantage !== "function") return;

  if (friendlyCount === hostileCount) return;

  const current = foundry.utils.duplicate(
    game.settings.get("wfrp4e", "groupAdvantageValues"),
  );
  let players = Number(current?.players) || 0;
  let enemies = Number(current?.enemies) || 0;

  const rawMax = game.settings.get("wfrp4e", "advantagemax");
  const maxAdv = Number.isNumeric(rawMax) ? Number(rawMax) : Infinity;

  const favorEnemies = hostileCount > friendlyCount;
  const delta = favorEnemies
    ? { players: -1, enemies: +1 }
    : { players: +1, enemies: -1 };

  const nextPlayers = clampPool(players + delta.players, 0, maxAdv);
  const nextEnemies = clampPool(enemies + delta.enemies, 0, maxAdv);

  debugLog("groupAdvantage: pre", {
    current,
    delta,
    maxAdv,
    friendlyCount,
    hostileCount,
  });
  debugLog("groupAdvantage: post", { players: nextPlayers, enemies: nextEnemies });

  if (nextPlayers === players && nextEnemies === enemies) return;
  await updateGroupAdvantage({ players: nextPlayers, enemies: nextEnemies });
}

async function onPreUpdateCombatForSideCount(combat, changed) {
  try {
    if (!game.settings.get(MODULE_ID, SETTING_KEY)) return;
    if (!game?.user?.isGM) return;
    if (!combat || !("round" in changed)) return;

    const oldRound = combat.round ?? 1;
    const newRound = Number(changed.round);
    if (!Number.isFinite(newRound) || newRound <= oldRound) return;

    const endedRound = oldRound;
    const { friendlyCount, hostileCount, winner, drilledWeightingEnabled } =
      computeSideCount(combat);
    const summary = {
      round: endedRound,
      friendlyCount,
      hostileCount,
      winner,
      drilledWeightingEnabled,
      updatedAt: Date.now(),
    };

    debugLog("computed", { combatId: combat.id, summary });
    await combat.setFlag(MODULE_ID, "endOfRoundSideCount", summary);
    await maybeShiftGroupAdvantagePools({ friendlyCount, hostileCount });
  } catch (err) {
    debugLog("error: exception", { combatId: combat?.id, error: err });
    console.error(`${MODULE_ID} | end-of-round side count`, err);
  }
}

export function registerEndOfRoundSideCountHooks() {
  Hooks.on("preUpdateCombat", onPreUpdateCombatForSideCount);
}

