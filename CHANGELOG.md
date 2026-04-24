# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Nothing yet.

## [0.1.0] - 2026-04-24

### Added

- Foundry module scaffold `wfrp4e-homebrew-qol` with ES module bootstrap (`scripts/wfrp4e-homebrew-qol.mjs`).
- **Combat Heal automation:** on successful **Heal** skill test during an active encounter, creates matching Active Effects on healer and target (or one effect on self-heal), fixed English description, two-round combat duration, movement set to 0 via Active Effect override where supported; GM-only application via `createChatMessage` hook.
- **Fast weapon (optional):** world setting `trackFastOutOfTurn` (default off); when enabled, creates a named `Fast` Active Effect on the attacker after a **WeaponTest** with the Fast quality while it is not their turn in the combat tracker; fixed English description; one-round duration approximation.
- `module.json` aligned with distribution fields (`url`, `manifest`, `download`) and `relationships.requires` for `wfrp4e-core`.
- GitHub Actions workflow `.github/workflows/release.yml` to package the module folder into `<id>.zip` and attach `module.json` + zip on published releases (mirrors [wfrp4e-nom](https://github.com/ricardopiloto/wfrp4e-nom) release flow).
- `README.md` and this `CHANGELOG.md`.

### Changed

- Nothing before this release.

### Fixed

- Nothing before this release.

[Unreleased]: https://github.com/ricardopiloto/wfrp4e-homebrew-qol/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ricardopiloto/wfrp4e-homebrew-qol/releases/tag/v0.1.0
