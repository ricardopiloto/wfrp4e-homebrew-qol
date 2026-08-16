# Homebrew QOL (WFRP4e)

Módulo Foundry VTT para **Warhammer Fantasy Roleplay 4th Edition** (sistema `wfrp4e`) com pequenas automações de qualidade de vida para regras caseiras.

**ID do pacote:** `wfrp4e-homebrew-qol`  
**Versão atual:** `0.1.2`  
**Repositório:** [github.com/ricardopiloto/wfrp4e-homebrew-qol](https://github.com/ricardopiloto/wfrp4e-homebrew-qol)

## Requisitos

- **Foundry VTT** v13+ (manifesto verificado com v14).
- Sistema **WFRP4e** (`wfrp4e`).
- Módulo **`wfrp4e-core`** (declarado em `relationships.requires` no `module.json`).
- Módulo **GM Toolkit (WFRP4e)** (`wfrp4e-gm-toolkit`) (declarado em `relationships.requires` no `module.json`).

## Instalação

### Instalação por URL do manifesto

Instale o módulo através do link https://github.com/ricardopiloto/wfrp4e-homebrew-qol/releases/download/v0.1.2/module.json

### Depois de instalar

1. Para a funcionalidade **Heal em combate**, a opção de mundo **Track Heal skill combat penalties** vem **ligada** por omissão; desliga nas definições do módulo se não quiseres essa automação.
2. Para a funcionalidade **Fast**, liga a opção nas definições do módulo (ver abaixo).

## Macros de downtime (Between Adventures)

Inspirado no comportamento de [WFRP4e-Endeavours](https://github.com/Txus5012/WFRP4e-Endeavours) (Txus5012), com MVP mais estreito (só Core Between Adventures; sem Travel nem settings de suplementos).

### Importar a macro

1. Ativa o módulo no mundo.
2. Abre **Compendium Packs** → pasta **WFRP4e Homebrew QoL** → pack **Homebrew QoL Macros**.
3. Importa a macro **Homebrew QoL — Downtime** (ou arrasta para a hotbar).

A macro só chama `game.wfrp4eHomebrewQol.openDowntimeMenu()`.

### Menu AppV2

Com tokens selecionados no canvas:

1. **Dinheiro para torrar (Money to Burn)** — só tokens de **PC** (`character`); confirma; põe GC/SS/BP a `0` (nomes localizados); publica chat com quem perdeu o dinheiro.
2. **Fazer entre aventuras (Perform Endeavour)** — pede aos owners dos tokens uma endeavour **Core Between Adventures** (Select / Read Journal / None) e publica a escolha no chat. Journals do Core Rulebook precisam existir no mundo para “Read Journal” abrir a página.

Também podes abrir o menu na consola: `game.wfrp4eHomebrewQol.openDowntimeMenu()`.

---

## O que o módulo faz

### 1. Heal em combate (opcional via definição)

Quando a opção de mundo **Track Heal skill combat penalties** está **ligada** (pré-definição: **sim**) e alguém faz um teste de perícia **Heal** com **sucesso** com um **encontro de combate** ativo (`game.combat`), o módulo cria **efeitos ativos** em:

- quem usou Heal (origem), e  
- o alvo do Heal (se for outro ator; se for auto‑cura, fica **um** só efeito no mesmo ator).

**Texto do efeito (inglês, fixo):**

> Heal skill used during combat: neither participant may move for two combat rounds; the healer also loses their next action.

**Comportamento técnico:**

- **Duração:** 2 rondas de combate (modelo de duração alinhado ao Foundry 13/14).
- **Ícone do efeito:** `icons/svg/heal.svg`.
- **Movimento:** o valor de movimento (`system.details.move.value`) é posto a **0** via modo OVERRIDE no efeito, para refletir “sem movimento” na medida do que o WFRP4e expõe.
- **“Perder a próxima ação”:** não existe uma chave estável de efeito no sistema para forçar isso automaticamente; a frase continua na descrição para lembrar a regra à mesa.

**Quem executa:** apenas o cliente do **GM** cria os efeitos (para funcionar mesmo quando jogadores não são donos de todos os atores).

**Deteção:** mensagem de chat `type: "test"` com dados do teste WFRP4e; deduplicação com *flag* na mensagem para não duplicar efeitos.

---

### 2. Arma **Fast** fora do turno (opcional)

Se a opção de mundo **Track Fast weapon attacks out of turn** estiver **ligada** (em *Configurações do módulo → Homebrew QOL*):

- Com **`game.combat`** ativo (não é obrigatório ter clicado em “Begin” / `started` no tracker), se o atacante usa um **WeaponTest** com arma com qualidade **Fast** e o **turno atual** do combate **não** é o do token/ator do atacante, é criado um efeito ativo na ficha do atacante.

**Nome do efeito:** `Fast`  

**Descrição (inglês, fixa):**

> Used the Fast weapon quality and acted out of turn; only movement is allowed for the remainder of the turn.

**Duração:** mantém-se até ao **fim da ronda de combate** em que o ataque ocorreu (quando o contador de ronda do encontro avança); não desaparece só porque o turno passou para outro combatente na mesma ronda. Ícone do efeito: `icons/svg/thrust.svg`. Detalhes em `scripts/fast-out-of-turn.mjs`.

**Mecânica extra:** o efeito não altera outras chaves além da descrição; a restrição “só locomoção” fica para a mesa aplicar se quiserem rigor total.

**Predefinição:** a opção vem **desligada**.

---

### 3. Contagem no fim da ronda (Friendly vs Hostile) + Group Advantage (opcional)

Se a opção de mundo **Track end-of-round side count (Friendly vs Hostile)** estiver **ligada**, ao **fim de cada Combat Round** o módulo:

- conta combatants **Friendly** vs **Hostile** no combate (**Neutral é ignorado**), e
- grava um resumo em `combat.flags["wfrp4e-homebrew-qol"].endOfRoundSideCount`.

Se o WFRP4e estiver com **Group Advantage** ligado (`wfrp4e.useGroupAdvantage`) e o helper existir, o módulo também ajusta os pools:

- se Friendly > Hostile: `players +1`, `enemies -1` (sem ir abaixo de 0)
- se Hostile > Friendly: `enemies +1`, `players -1` (sem ir abaixo de 0)
- empate: não altera

---

## Ficheiros principais

| Ficheiro | Função |
|----------|--------|
| `module.json` | Manifesto Foundry, dependências; `version`/`url`/`manifest`/`download` são placeholders preenchidos pelo CI no release. |
| `scripts/wfrp4e-homebrew-qol.mjs` | Entrada: `init` / `ready`, registo das outras partes. |
| `scripts/combat-heal-effects.mjs` | Automação Heal em combate. |
| `scripts/fast-out-of-turn.mjs` | Definição + automação Fast fora de turno. |
| `scripts/end-of-round-side-count.mjs` | Contagem Friendly vs Hostile no fim da ronda e shift de Group Advantage. |
| `scripts/downtime-menu.mjs` | AppV2 do menu de downtime. |
| `scripts/downtime-actions.mjs` | Money to Burn + Perform Endeavour (Core BA) + socket. |
| `packs/homebrew-qol-macros` | Pack com a macro launcher. |
| `.github/workflows/release.yml` | CI: ao publicar um *release*, substitui placeholders no `module.json`, gera o ZIP e anexa os artefactos (estilo [weatherfx](https://github.com/ricardopiloto/weatherfx)). |

## Cutting a release

1. Atualiza o [`CHANGELOG.md`](CHANGELOG.md) e o README com a versão a publicar.
2. Publica um **GitHub Release** com tag `vX.Y.Z` (ex.: `v0.1.2`).
3. O workflow `.github/workflows/release.yml` faz checkout do tag, substitui `${version}`, `${url}`, `${manifest}` e `${download}` no `module.json`, empacota `wfrp4e-homebrew-qol.zip` e faz upload do zip + manifesto no release (`gh release upload --clobber`).

Não é necessário editar manualmente os URLs de `download` no `module.json` do repositório: esses campos são placeholders preenchidos pelo CI.

## Desenvolvimento e versões

- Alterações notáveis: ver [`CHANGELOG.md`](CHANGELOG.md) no formato [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
- Versões seguem [Semantic Versioning](https://semver.org/spec/v2.0.0.html) quando possível.

## Licença e aviso

Este módulo é independente; **WFRP** é marca registada da Games Workshop. Não é produto oficial nem endossado por terceiros.
