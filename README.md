# Gastos Produtos

Aplicativo desktop para gestão local de **produtos** (matéria-prima), **embalagens**, **receitas** e **grupos** de receita, com custos em real (BRL). Os dados ficam no seu computador; não é necessário servidor nem conta na nuvem.

## Requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (recomendado: LTS atual)
- npm (incluído com o Node)

No Windows, o instalador Squirrel pode exigir ferramentas de build nativas para dependências como `sqlite3` durante `npm install`. Se a instalação falhar, use o [windows-build-tools](https://github.com/nodejs/node-gyp#on-windows) ou o Visual Studio Build Tools conforme a documentação do [node-gyp](https://github.com/nodejs/node-gyp).

## Instalação

```bash
git clone https://github.com/leopoliveira/gastos-produtos-electron.git
cd gastos-produtos-electron
npm install
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` / `npm start` | Inicia o app em modo desenvolvimento (Electron Forge + Vite). |
| `npm run package` | Gera o app empacotado (sem instalador) em `out/`. |
| `npm run make` | Gera artefatos de distribuição (instalador Squirrel no Windows, ZIP no macOS, `.deb`/`.rpm` no Linux). |
| `npm run verify` | Executa lint, checagem de tipos e testes. |
| `npm run release:local` | Roda `verify` e em seguida `make`. |
| `npm run lint` | ESLint em `.ts` e `.tsx`. |
| `npm run typecheck` | TypeScript sem emitir arquivos. |
| `npm run test` | Vitest em modo run único. |

## Onde os dados são guardados

O banco SQLite (`gastos.db`) fica na pasta de dados do usuário do Electron, em `App_Data/gastos.db` (por exemplo, no Windows, dentro do diretório `userData` do app). Migrações de esquema rodam na inicialização.

## Stack

- **Electron** (processo principal + janela)
- **React 18** + **React Router** (interface com roteamento hash)
- **Vite** + **TypeScript**
- **Electron Forge** (build, empacotamento e makers)
- **SQLite** (`sqlite` + `sqlite3`) no processo principal, exposto à UI via IPC tipado
- **electron-log** para logs no processo principal; a UI encaminha logs por IPC

Arquitetura e regras para contribuições (segurança Electron, IPC, CSS, testes) estão em [`AGENTS.md`](./AGENTS.md).

## Licença

MIT — ver campo `license` no `package.json`.

## Autor

Leonardo Oliveira (`poliveira.leonardo@gmail.com`).
