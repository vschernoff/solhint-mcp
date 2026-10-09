# Contributing

Issues and pull requests are welcome.

## Getting set up

Node.js 20 or newer.

```bash
git clone https://github.com/vschernoff/solhint-mcp
cd solhint-mcp
npm install
npm test
```

| Command               | What it does                                         |
| --------------------- | ---------------------------------------------------- |
| `npm test`            | Unit tests and a real MCP conversation over stdio    |
| `npm run test:packed` | Packs a tarball and drives the installed server      |
| `npm run lint`        | ESLint over `src` and `test`, Prettier over the repo |
| `npm run format`      | Applies Prettier                                     |
| `npm start`           | Runs the server on stdio in the current directory    |

CI runs Tests, Docker and Solhint compatibility on every pull request. The compatibility
job runs the suite against each supported Solhint version, so a change that depends on
behaviour from one version will be caught there rather than by a user.

## Pull requests

- Keep the change focused; unrelated cleanups in a separate PR.
- Add or adjust tests. A bug fix should come with a test that fails without it.
- Run `npm run lint` before pushing — formatting failures are the most common red CI.
- Describe what a user would observe, not only what the code does.

### Changes to tool behaviour

The seven tools are an interface that agents depend on. If a change alters a tool's
schema, its output shape, or the `instructions` field in `src/index.js`, say so
explicitly in the PR description. The `instructions` field has a hard budget: some
clients keep only the first 512 characters, so additions there need a corresponding
deletion.

## Licensing and attribution

Contributions are accepted under the MIT licence in `LICENSE` — inbound matches outbound.
There is no CLA.

This repository contains work by more than one author and `NOTICE` records which files
originate where. **`NOTICE` ships in the published package and both copyright lines must
be preserved.** If you move code between files, keep the attribution accurate.

## Governance

Decisions rest with the maintainer, [@vschernoff](https://github.com/vschernoff), who
created this server and maintains it.

Solhint itself is a separate project, governed and released by
[Protofire](https://github.com/protofire/solhint), and is a dependency of this package
rather than part of it. Bugs in Solhint's rules, autofixes or configuration belong in
Solhint's tracker; bugs in how this server exposes them belong here. If you are not sure
which, open it here and it will be routed.

## Security

Do not report vulnerabilities as issues. See [SECURITY.md](SECURITY.md).

## Conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
