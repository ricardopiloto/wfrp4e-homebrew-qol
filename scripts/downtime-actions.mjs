const MODULE_ID = "wfrp4e-homebrew-qol";

const SOCKET_OP_PLAYER_ENDEAVOUR = "playerEndeavour";

/**
 * @returns {Token[]}
 */
export function getControlledCharacterTokens() {
  return canvas.tokens?.controlled?.filter((t) => t.actor?.type === "character") ?? [];
}

/**
 * @param {Actor} actor
 * @returns {Promise<void>}
 */
export async function zeroActorCoins(actor) {
  const gc = actor.items.getName(game.i18n.localize("NAME.GC"));
  const ss = actor.items.getName(game.i18n.localize("NAME.SS"));
  const bp = actor.items.getName(game.i18n.localize("NAME.BP"));
  const updates = [];
  for (const item of [gc, ss, bp]) {
    if (item) updates.push({ _id: item.id, "system.quantity.value": 0 });
  }
  if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
}

/**
 * Money to Burn — PCs only, confirm, zero GC/SS/BP, chat summary.
 */
export async function moneyToBurn() {
  const tokens = getControlledCharacterTokens();
  if (!tokens.length) {
    ui.notifications.error("You must select at least one PC token.");
    return;
  }

  const playersList = `<ul>${tokens.map((t) => `<li>${t.actor.name}</li>`).join("")}</ul>`;
  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: { title: "Dinheiro para torrar (Money to Burn)" },
    content: `<p>The money of these actors will be burned:</p>${playersList}<p>This action can't be undone. Are you sure?</p>`,
  });

  if (!confirmed) {
    return;
  }

  for (const token of tokens) {
    await zeroActorCoins(token.actor);
  }

  const names = tokens.map((t) => t.actor.name).join("<br>");
  await ChatMessage.create({
    content: `Money burnt from:<b><br>${names}</b>`,
  });
}

/** Core Between Adventures endeavours (labels + journal UUID + chat fragment). No ActiveEffect pack links. */
export const CORE_BETWEEN_ADVENTURES = [
  {
    key: "Animal Training",
    label: "Animal Training",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.WQQk92GoGp7fRH89",
  },
  {
    key: "Banking",
    label: "Banking",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.OqE6vzTEebofbX92",
  },
  {
    key: "Changing Career",
    label: "Changing Career",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.oj2iiLVfNWp7KIhk",
  },
  {
    key: "Commission",
    label: "Commission",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.Z1GbXJsphhaTINRA",
  },
  {
    key: "Consult an Expert",
    label: "Consult an Expert",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.0EF53KOVgme173EO",
  },
  {
    key: "Crafting",
    label: "Crafting",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.RQLJYU3OyA0WUoPG",
  },
  {
    key: "Income",
    label: "Income",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.JX9ifRlgzzGrU2zh",
  },
  {
    key: "Invent!",
    label: "Invent!",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.WlZBXUi7qdCCeNl1",
  },
  {
    key: "Training",
    label: "Training",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.0T8zisBH3D082Ztw",
  },
  {
    key: "Unusual Learning",
    label: "Unusual Learning",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.bWcKCn1S1ufDG9bJ",
  },
  {
    key: "Combat Training",
    label: "Combat Training (Rangers, Warriors)",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.517cQPn5p1bkRUgu",
  },
  {
    key: "Foment Dissent",
    label: "Foment Dissent (Burghers, Peasants)",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.RHsuOsC5DpoD4bkR",
  },
  {
    key: "The Latest News",
    label: "The Latest News (Rangers, Riverfolk)",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.Ujg3N2RiGC4RNSvH",
  },
  {
    key: "Reputation",
    label: "Reputation (Academics, Burghers, Courtiers)",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.N4EC4CCPZtX9i5qa",
  },
  {
    key: "Research Lore",
    label: "Research Lore (Academics)",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.2fjLtw5evY7LnjS0",
  },
  {
    key: "Study a Mark",
    label: "Study a Mark (Rogues)",
    journalUuid: "JournalEntry.gLDW6JBuoYuzCoya.JournalEntryPage.7OPLj3XFgJvpj24D",
  },
];

/**
 * @param {string} journalUuid
 * @param {string} label
 * @returns {string}
 */
function chatFragmentFor(journalUuid, label) {
  return `@UUID[${journalUuid}]{${label}}`;
}

/**
 * @param {Actor} actor
 * @param {string} html
 */
async function generateChat(actor, html) {
  await ChatMessage.create({
    user: game.user.id,
    speaker: { alias: actor.name },
    content: html,
  });
}

/**
 * @param {string} journalUuid
 */
async function openJournalPage(journalUuid) {
  let page = null;
  try {
    page = await fromUuid(journalUuid);
  } catch {
    page = null;
  }
  if (!page) {
    ui.notifications.notify("Journal Page not found");
    return;
  }
  const parent = page.parent ?? page;
  if (page.parent) {
    parent.sheet?.render(true, { pageId: page.id });
  } else {
    page.sheet?.render(true);
  }
}

/**
 * @param {Actor} actor
 */
export async function openEndeavourDialog(actor) {
  const optionsHtml = CORE_BETWEEN_ADVENTURES.map(
    (e) =>
      `<option value="${e.key}">${foundry.utils.escapeHTML(e.label)}</option>`,
  ).join("");

  const content = `<div class="form-group">
    <label for="endeavour">Choose an endeavour:</label>
    <select name="endeavour" id="endeavour">${optionsHtml}</select>
  </div>`;

  const byKey = Object.fromEntries(CORE_BETWEEN_ADVENTURES.map((e) => [e.key, e]));

  const d = new foundry.applications.api.DialogV2({
    window: { title: "Between Adventures Endeavours" },
    content,
    buttons: [
      {
        action: "select",
        icon: "fa-solid fa-helmet-safety",
        label: "Select",
        callback: async (_event, button) => {
          const key = new foundry.applications.ux.FormDataExtended(button.form).object.endeavour;
          const entry = byKey[key];
          const fragment = entry
            ? chatFragmentFor(entry.journalUuid, entry.label)
            : foundry.utils.escapeHTML(String(key));
          await generateChat(
            actor,
            `<h3>I will do <b>${fragment}</b></h3>`,
          );
          d.close();
        },
      },
      {
        action: "journal",
        icon: "fa-solid fa-book",
        label: "Read Journal",
        callback: async (_event, button) => {
          const key = new foundry.applications.ux.FormDataExtended(button.form).object.endeavour;
          const entry = byKey[key];
          if (!entry) {
            ui.notifications.notify("Journal Page not found");
            return;
          }
          await openJournalPage(entry.journalUuid);
        },
      },
      {
        action: "none",
        icon: "fa-solid fa-bed",
        label: "None",
        callback: async () => {
          await generateChat(actor, "<h3>I will do nothing in particular.</h3>");
          d.close();
        },
      },
    ],
    position: { width: 560 },
    form: { closeOnSubmit: false },
  });

  d.render(true);
}

/**
 * Start Perform Endeavour for controlled tokens (local owners + socket to others).
 */
export function performEndeavour() {
  const tokens = canvas.tokens?.controlled ?? [];
  if (!tokens.length) {
    ui.notifications.error("You must select at least one token.");
    return;
  }

  for (const token of tokens) {
    const actor = token.actor;
    if (!actor) continue;
    if (actor.isOwner) openEndeavourDialog(actor);
    game.socket.emit(`module.${MODULE_ID}`, {
      operation: SOCKET_OP_PLAYER_ENDEAVOUR,
      actorUuid: actor.uuid,
    });
  }
}

/**
 * Register socket listener for player endeavour prompts.
 */
export function registerDowntimeSocket() {
  game.socket.on(`module.${MODULE_ID}`, async (data) => {
    if (data?.operation !== SOCKET_OP_PLAYER_ENDEAVOUR) return;
    const actor = await fromUuid(data.actorUuid);
    if (!actor?.isOwner) return;
    openEndeavourDialog(actor);
  });
}

export { MODULE_ID, SOCKET_OP_PLAYER_ENDEAVOUR };
