import {
  moneyToBurn,
  performEndeavour,
} from "./downtime-actions.mjs";

const { ApplicationV2 } = foundry.applications.api;

/** @type {DowntimeMenu | null} */
let openMenu = null;

/**
 * Simple ApplicationV2 menu for downtime macros.
 */
export class DowntimeMenu extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "wfrp4e-homebrew-qol-downtime-menu",
    classes: ["wfrp4e-homebrew-qol", "downtime-menu"],
    tag: "div",
    window: {
      title: "Homebrew QoL — Downtime",
      resizable: false,
      contentClasses: ["standard-form"],
    },
    position: { width: 420 },
    actions: {
      moneyToBurn: DowntimeMenu.onMoneyToBurn,
      performEndeavour: DowntimeMenu.onPerformEndeavour,
    },
  };

  /** @override */
  async _renderHTML(_context, _options) {
    const root = document.createElement("div");
    root.classList.add("flexcol", "wfrp4e-homebrew-qol-downtime-menu");
    root.innerHTML = `
      <p class="notes">Select tokens on the canvas, then choose an action.</p>
      <menu class="unlist flexcol" style="gap: 0.5rem; padding: 0; margin: 0; list-style: none;">
        <li>
          <button type="button" data-action="moneyToBurn" style="width: 100%;">
            <i class="fa-solid fa-coins"></i>
            Dinheiro para torrar (Money to Burn)
          </button>
        </li>
        <li>
          <button type="button" data-action="performEndeavour" style="width: 100%;">
            <i class="fa-solid fa-campground"></i>
            Fazer entre aventuras (Perform Endeavour)
          </button>
        </li>
      </menu>
    `;
    return root;
  }

  /** @override */
  _replaceHTML(result, content, _options) {
    content.replaceChildren(result);
  }

  /** @override */
  async close(options) {
    if (openMenu === this) openMenu = null;
    return super.close(options);
  }

  static async onMoneyToBurn(_event, _target) {
    this.close();
    await moneyToBurn();
  }

  static async onPerformEndeavour(_event, _target) {
    this.close();
    performEndeavour();
  }
}

/**
 * Open (or focus) the downtime AppV2 menu.
 */
export function openDowntimeMenu() {
  if (openMenu) {
    openMenu.render({ force: true });
    return openMenu;
  }
  openMenu = new DowntimeMenu();
  openMenu.render({ force: true });
  return openMenu;
}
