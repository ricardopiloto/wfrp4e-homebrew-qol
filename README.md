# Homebrew QOL (WFRP4e)

Módulo Foundry VTT para **Warhammer Fantasy Roleplay 4th Edition** (sistema `wfrp4e`) com pequenas automações de qualidade de vida para regras caseiras.

**ID do pacote:** `wfrp4e-homebrew-qol`  
**Repositório:** [github.com/ricardopiloto/wfrp4e-homebrew-qol](https://github.com/ricardopiloto/wfrp4e-homebrew-qol)

## Requisitos

- **Foundry VTT** v13+ (manifesto verificado com v14).
- Sistema **WFRP4e** (`wfrp4e`).
- Módulo **`wfrp4e-core`** (declarado em `relationships.requires` no `module.json`).

## Instalação

1. Copie a pasta do módulo para `Data/modules/wfrp4e-homebrew-qol/`, **ou** instale pelo URL do manifesto nas definições de módulo do Foundry (quando existir release com `module.json` publicado).
2. Ative o módulo nas **Configurações de módulos** do mundo.
3. Para a funcionalidade **Fast**, ligue a opção nas definições do módulo (ver abaixo).

## O que o módulo faz

### 1. Heal em combate (sempre ativo)

Quando alguém faz um teste de perícia **Heal** com **sucesso** e existe um **encontro de combate** ativo (`game.combat`), o módulo cria **efeitos ativos** em:

- quem usou Heal (origem), e  
- o alvo do Heal (se for outro ator; se for auto‑cura, fica **um** só efeito no mesmo ator).

**Texto do efeito (inglês, fixo):**

> Heal skill used during combat: neither participant may move for two combat rounds; the healer also loses their next action.

**Comportamento técnico:**

- **Duração:** 2 rondas de combate (modelo de duração alinhado ao Foundry 13/14).
- **Movimento:** o valor de movimento (`system.details.move.value`) é posto a **0** via modo OVERRIDE no efeito, para refletir “sem movimento” na medida do que o WFRP4e expõe.
- **“Perder a próxima ação”:** não existe uma chave estável de efeito no sistema para forçar isso automaticamente; a frase continua na descrição para lembrar a regra à mesa.

**Quem executa:** apenas o cliente do **GM** cria os efeitos (para funcionar mesmo quando jogadores não são donos de todos os atores).

**Deteção:** mensagem de chat `type: "test"` com dados do teste WFRP4e; deduplicação com *flag* na mensagem para não duplicar efeitos.

---

### 2. Arma **Fast** fora do turno (opcional)

Se a opção de mundo **Track Fast weapon attacks out of turn** estiver **ligada** (em *Configurações do módulo → Homebrew QOL*):

- Em **combate iniciado**, se o atacante usa um **WeaponTest** com arma que tem a qualidade **Fast** (`item.properties.qualities.fast`) e o **turno atual** do combate **não** é o do token/ator do atacante, é criado um efeito ativo na ficha do atacante.

**Nome do efeito:** `Fast`  

**Descrição (inglês, fixa):**

> Used the Fast weapon quality and acted out of turn; only movement is allowed for the remainder of the turn.

**Duração:** 1 ronda de combate (aproximação a “resto do turno” / limpeza ao avançar a ronda; ver comentários em `scripts/fast-out-of-turn.mjs`).

**Mecânica extra:** o efeito não altera outras chaves além da descrição; a restrição “só locomoção” fica para a mesa aplicar se quiserem rigor total.

**Predefinição:** a opção vem **desligada**.

---

## Ficheiros principais

| Ficheiro | Função |
|----------|--------|
| `module.json` | Manifesto Foundry, dependências, URLs de release. |
| `scripts/wfrp4e-homebrew-qol.mjs` | Entrada: `init` / `ready`, registo das outras partes. |
| `scripts/combat-heal-effects.mjs` | Automação Heal em combate. |
| `scripts/fast-out-of-turn.mjs` | Definição + automação Fast fora de turno. |
| `.github/workflows/release.yml` | CI: ao publicar um *release*, gera o ZIP do módulo e anexa `module.json` + zip (estilo [wfrp4e-nom](https://github.com/ricardopiloto/wfrp4e-nom)). |

## Desenvolvimento e versões

- Alterações notáveis: ver [`CHANGELOG.md`](CHANGELOG.md) no formato [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
- Versões seguem [Semantic Versioning](https://semver.org/spec/v2.0.0.html) quando possível.

## Licença e aviso

Este módulo é independente; **WFRP** é marca registada da Games Workshop. Não é produto oficial nem endossado por terceiros.
