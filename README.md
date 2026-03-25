# Gastos Produtos

Aplicativo desktop (Electron) para gestão local de:

- produtos (matéria-prima)
- embalagens
- receitas
- grupos de receita

O objetivo é centralizar custos em BRL (R$), sem depender de servidor remoto.
Os dados ficam no computador do usuário, em SQLite.

## Visão geral

- **Frontend:** React 18 + TypeScript (renderer)
- **Backend local:** SQLite no processo principal (main)
- **Bridge segura:** preload com API tipada via IPC
- **Build e distribuição:** Electron Forge + Vite
- **Logs:** `electron-log` no main, com encaminhamento do renderer via IPC

## Funcionalidades principais

- cadastro e manutenção de produtos
- cadastro e manutenção de embalagens
- cadastro e manutenção de grupos
- cadastro e manutenção de receitas
- composição de receitas com unidades de medida flexíveis (ex.: kg/g/mg e l/ml), preservando exatamente o formato informado pelo usuário
- cálculo e exibição de valores em moeda BRL
- persistência local com migrações versionadas de banco

## Arquitetura (resumo)

O projeto segue o modelo padrão de segurança do Electron:

- `main`: ciclo de vida da aplicação, banco SQLite, registro dos handlers IPC
- `preload`: camada de bridge (`window.appApi`) entre renderer e main
- `renderer`: UI React (não recebe acesso direto a Node/Electron)
- `shared`: contratos IPC, tipos e utilitários puros compartilhados

Fluxo de dados típico:

`UI (renderer) -> service -> preload (appApi) -> IPC invoke -> main/backend -> SQLite`

## Requisitos

- [Node.js](https://nodejs.org/) 18+ (recomendado: LTS atual)
- npm (vem com Node.js)

### Observação para Windows

Dependências nativas como `sqlite3` podem exigir ferramentas de build no `npm install`.
Se houver falha, instale os componentes recomendados pela documentação do [`node-gyp`](https://github.com/nodejs/node-gyp#on-windows) (ex.: Visual Studio Build Tools).

## Instalação

```bash
git clone https://github.com/leopoliveira/gastos-produtos-electron.git
cd gastos-produtos-electron
npm install
```

## Como rodar em desenvolvimento

```bash
npm run dev
```

Ou:

```bash
npm start
```

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o app em modo desenvolvimento (Electron Forge + Vite). |
| `npm start` | Alias para `npm run dev`. |
| `npm run lint` | Executa ESLint em arquivos `.ts` e `.tsx`. |
| `npm run typecheck` | Executa TypeScript (`tsc --noEmit`). |
| `npm run test` | Executa testes com Vitest (`run`). |
| `npm run verify` | Roda lint + typecheck + testes. |
| `npm run package` | Gera app empacotado (sem instalador) em `out/`. |
| `npm run make` | Gera artefatos de distribuição (inclui Squirrel no Windows). |
| `npm run release:local` | Executa `verify` e depois `make`. |
| `npm run publish` | Executa `verify` e publica via Electron Forge. |

## Build e distribuição

- `npm run package`: útil para validar o app empacotado localmente.
- `npm run make`: gera instaladores/pacotes conforme plataforma configurada.

Makers configurados:

- Windows: Squirrel
- macOS: ZIP
- Linux: DEB e RPM

## Banco de dados local

- O banco é SQLite (`gastos.db`).
- A inicialização e migração acontecem no processo `main`.
- O arquivo é salvo no diretório `userData` do Electron, na convenção `App_Data/gastos.db`.

## Segurança (Electron)

A aplicação adota defaults seguros no `BrowserWindow`, incluindo:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`

Além disso, o projeto usa hardening de fuses no Electron Forge (`@electron-forge/plugin-fuses`), incluindo `OnlyLoadAppFromAsar` e validação de integridade de ASAR embutida.

## Estrutura de pastas (alto nível)

```text
src/
  main/       # ciclo de vida, backend local, IPC, logging
  preload/    # bridge segura renderer <-> main
  renderer/   # UI React e serviços de frontend
  shared/     # contratos IPC, tipos e utilitários puros
tests/        # testes
assets/       # arquivos estáticos
```

## Desenvolvimento e contribuição

- Mantenha o fluxo via IPC tipado (`shared` -> `main` -> `preload` -> `renderer`).
- Não exponha APIs de Node/Electron diretamente no renderer.
- Prefira manter regra de negócio e acesso a SQLite no `main`.
- Rode `npm run verify` antes de abrir PR.

Para convenções completas de arquitetura, segurança, performance, CSS e testes, consulte [`AGENTS.md`](./AGENTS.md).

## Troubleshooting rápido

- **Falha no `npm install` com módulos nativos (Windows):** verificar toolchain do `node-gyp`.
- **Erro de build/packaging:** limpar dependências e reinstalar (`node_modules`, lockfile) pode ajudar em ambientes locais inconsistentes.
- **Problemas de banco local:** validar permissões de escrita no diretório `userData` da aplicação.

## Licença

MIT.

## Autor

Leonardo Oliveira (`poliveira.leonardo@gmail.com`)
