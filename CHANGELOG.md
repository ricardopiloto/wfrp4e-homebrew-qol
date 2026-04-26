# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Nothing yet.

### Fixed

- Nothing yet.

## [0.1.2] - 2026-04-25

### Added

- Definição de mundo **Debug combat automations (Fast / Heal)** (`debugCombatAutomations`, pré-definição **desligada**) para log detalhado no console.
- **Contagem no fim da ronda (opcional):** definição de mundo **Track end-of-round side count (Friendly vs Hostile)** (`trackEndOfRoundSideCount`, pré-definição **desligada**) que conta combatants Friendly vs Hostile (Neutral ignorado), grava flag no `Combat`, e ajusta **Group Advantage** quando ativo no sistema WFRP4e.

### Changed

- `module.json`: adicionada dependência requerida do módulo **GM Toolkit (WFRP4e)** (`wfrp4e-gm-toolkit`).
- **Fast (opcional):** o efeito `Fast` agora aparece como **Temporary Effect** (e continua a ser removido ao fim da ronda via cleanup do módulo).

### Fixed

- **Fast (opcional):** a automação voltou a criar o efeito quando há combate no tracker **sem** `combat.started`; deteção de qualidade **Fast** alargada a campos comuns em `item.system`; aplica corretamente em token **unlinked**; limpeza ao fim da ronda usa `preUpdateCombat` só quando o número da ronda **sobe** de facto.
- **Heal (opcional):** deteção ficou mais resiliente a variações do `rollClass` quando o teste reconstruído corresponde ao Heal localizado e foi um sucesso.

## [0.1.1] - 2026-04-25

### Added

- Definição de mundo **Track Heal skill combat penalties** (`trackHealCombatPenalty`, pré-definição **ligada**): permite desligar a automação dos efeitos de Heal em combate nas definições do módulo (mesmo padrão que o Fast).

### Changed

- **Fast (opcional):** o efeito `Fast` por ataque fora de turno expira ao **fim da ronda de combate** (avanço do contador de ronda), não apenas ao mudar o turno para outro combatente na mesma ronda; limpeza no cliente GM via `updateCombat` / `deleteCombat` (`scripts/fast-out-of-turn.mjs`).
- **Ícones dos efeitos:** penalidade Heal em combate usa `icons/svg/heal.svg`; efeito Fast usa `icons/svg/thrust.svg`.

## [0.1.0] - 2026-04-24

### Added

- Foundry module scaffold `wfrp4e-homebrew-qol` with ES module bootstrap (`scripts/wfrp4e-homebrew-qol.mjs`).
- **Combat Heal automation:** on successful **Heal** skill test during an active encounter, creates matching Active Effects on healer and target (or one effect on self-heal), fixed English description, two-round combat duration, movement set to 0 via Active Effect override where supported; GM-only application via `createChatMessage` hook.
- **Fast weapon (optional):** world setting `trackFastOutOfTurn` (default off); when enabled, creates a named `Fast` Active Effect on the attacker after a **WeaponTest** with the Fast quality while it is not their turn in the combat tracker; fixed English description; one-round duration approximation.
- `module.json` with repository `url` and `relationships.requires` for `wfrp4e-core` (manifest/download URLs intended once GitHub Releases ship matching assets).
- GitHub Actions workflow `.github/workflows/release.yml` to package the module folder into `<id>.zip` and attach `module.json` + zip on published releases (mirrors [wfrp4e-nom](https://github.com/ricardopiloto/wfrp4e-nom) release flow).
- `README.md` and this `CHANGELOG.md`.

### Changed

- Nothing before this release.

### Fixed

- Nothing before this release.

[Unreleased]: https://github.com/ricardopiloto/wfrp4e-homebrew-qol/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/ricardopiloto/wfrp4e-homebrew-qol/releases/tag/v0.1.2
[0.1.1]: https://github.com/ricardopiloto/wfrp4e-homebrew-qol/releases/tag/v0.1.1
[0.1.0]: https://github.com/ricardopiloto/wfrp4e-homebrew-qol/releases/tag/v0.1.0
