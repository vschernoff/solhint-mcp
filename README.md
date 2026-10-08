# solhint-mcp

Lint and autofix Solidity smart contracts with [Solhint](https://github.com/protofire/solhint),
from any MCP client — Claude Code, OpenAI Codex, Cursor, Windsurf, Claude Desktop, and
anything else that speaks the protocol. Nothing in it is specific to one vendor.

Your agent gets seven tools: `lint_solidity`, `lint_file`, `lint_project`,
`fix_solidity`, `fix_file`, `explain_rule` and `get_config`.

> Solhint's CLI points users at this package —
> [protofire/solhint#801](https://github.com/protofire/solhint/pull/801), shipped in
> Solhint 6.2.5.

## Installation

Add this to your MCP client's configuration, with the Solidity project as the working
directory:

```json
{
  "mcpServers": {
    "solhint": {
      "command": "npx",
      "args": ["-y", "solhint-mcp"]
    }
  }
}
```

Requires **Node.js 20 or newer**. On native Windows, clients that launch servers through
`npx` generally need `"command": "cmd"` with `"args": ["/c", "npx", "-y", "solhint-mcp"]`.

One server process lints one project: its working directory is the project root, so
start another process for a different project. A Solhint installed in that project takes
precedence over the copy bundled here.

<details>
<summary>How it runs Solhint</summary>

The server calls Solhint through its JavaScript API. It does not start a shell, invoke
`npx solhint`, make update checks, or parse CLI output.

</details>

### Client-specific shortcuts

**Claude Code** — from the Solidity project directory:

```bash
claude mcp add solhint -- npx -y solhint-mcp
```

The default local scope associates the server with the current project. Use
`--scope project` before `--` if the configuration should be committed in `.mcp.json`.
On native Windows, Claude Code requires `cmd /c`:

```bash
claude mcp add solhint -- cmd /c npx -y solhint-mcp
```

**OpenAI Codex** — Codex uses TOML, not the JSON block above, and shares one
configuration across the Codex CLI, the ChatGPT desktop app and the IDE extension.
From the Solidity project directory:

```bash
codex mcp add solhint -- npx -y solhint-mcp
```

Or add it by hand to `~/.codex/config.toml`, or to `.codex/config.toml` to scope it
to one project:

```toml
[mcp_servers.solhint]
command = "npx"
args = ["-y", "solhint-mcp"]
```

**Cursor / Windsurf** — add the JSON block above to the editor's MCP settings.

**Claude Desktop** — installation is separate from Claude Code. This package is a
stdio npm server, not a packaged Desktop Extension (`.mcpb`). Configure it as a local
development MCP server only if the client launches it with the Solidity project as its
working directory. See Anthropic's current
[local-server instructions](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop).

## Tools

| Tool            | Input                  | Description                             |
| --------------- | ---------------------- | --------------------------------------- |
| `lint_solidity` | `{ code, config? }`    | Lint a Solidity source string           |
| `lint_file`     | `{ filePath }`         | Lint one `.sol` file inside the project |
| `lint_project`  | `{ pattern? }`         | Lint a project-relative glob            |
| `fix_solidity`  | `{ code, config? }`    | Autofix a Solidity source string        |
| `fix_file`      | `{ filePath, write? }` | Autofix one `.sol` file                 |
| `explain_rule`  | `{ ruleId }`           | Explain any rule the linter ships       |
| `get_config`    | `{}`                   | Show the project's Solhint config       |

`lint_project` autodetects `contracts/**/*.sol`, then `src/**/*.sol`, and finally
`**/*.sol`. Paths and patterns outside the project root are rejected.

The `fix_*` tools apply Solhint's own autofixes and then re-lint, so what they report
as remaining is what is genuinely left rather than the pre-fix report. `fix_solidity`
returns the corrected source and touches nothing on disk. `fix_file` previews by
default and only writes when called with `write: true` — Solhint's CLI asks for a
backup before `--fix`, and an MCP client should not rewrite someone's contracts
without being asked either.

`explain_rule` reads the documentation Solhint ships with each rule, so it covers the
whole registry and always describes the version this project runs: description,
category, default severity, configurable options, notes and the good/bad examples when
the rule defines them.

## If your repository already documents a lint command

An agent follows an explicit instruction in your repository over a tool description.
If `AGENTS.md`, `CLAUDE.md`, `.cursorrules` or a similar agent playbook says how to
lint, for example:

```markdown
- Solidity lint: `npm run lint:sol`
```

the agent will run that command and never reach for these tools. That is reasonable
behaviour, not a misconfiguration, but it means the server goes unused until you say it
is there. Mention it alongside the command:

```markdown
- Solidity lint: prefer the `solhint` MCP tools (`lint_file`, `lint_project`,
  `fix_file`, `explain_rule`, `get_config`) when that server is configured; they run this project's
  own Solhint with its config. Fall back to `npm run lint:sol` when the server is
  unavailable.
```

The two are complementary. The command is what a person and CI run. The tools are what
an agent runs, and their advantage is that the invocation cannot drift: no unquoted
`**` collapsing to a single level, no forgotten config, no stray flag. A shell glob
written by hand can silently cover a fraction of a project; `lint_project` cannot.

## Configuration

`lint_solidity` uses configuration in this order:

1. The complete `config` object supplied to the tool.
2. The configuration found in the project root.
3. `{ "extends": "solhint:recommended" }`.

An explicit config replaces the project config; it is not merged. File and project
linting use Solhint's per-file configuration hierarchy and the same recommended fallback
when no configuration exists.

The server prefers a compatible `solhint` (`>=6.1.0 <7.0.0`) installed by the project.
If none exists, it uses its bundled, tested version. An installed but incompatible
project version produces an explicit error. Pass `--bundled-solhint` only when you
intentionally want the bundled version.

Solhint 6.0.x is excluded because its plugin loader can terminate the host process when
a configured plugin cannot be loaded, which is unsafe for an in-process MCP server.

## Protocol and current limitations

The server uses `@modelcontextprotocol/server` 2.x over stdio. It supports the current
2026-07-28 lifecycle and the SDK's legacy compatibility path.

Solhint currently resolves shareable configs and plugins relative to `process.cwd()`.
That is why this release supports one project per process. A third-party plugin that
writes to stdout synchronously is redirected to stderr while linting so it cannot corrupt
the MCP channel. Full plugin isolation, cancellation, and lint timeouts are deferred to a
worker-based release.

## Docker

```bash
docker build -t solhint-mcp .
docker run -i --rm -v "$PWD":/project solhint-mcp
```

The server lints whatever directory it starts in, so the Solidity project is mounted at
`/project`, which is the image's working directory. `-i` is required because the server
speaks MCP over stdio; no port is exposed. A Solhint installed in the mounted project
takes precedence over the image's own copy.

## MCP Registry

Listed as `io.github.vschernoff/solhint-mcp`. `server.json` in this repository is the
registry manifest; its `name` must stay identical to `mcpName` in `package.json`, and
both version fields must match the published npm version, or a registry publish is
rejected.

## Credits and licence

MIT. The linting runner, tool surface and test suite were originally written by
Diego Bale ([@dbale-arg](https://github.com/dbale-arg)) for
[protofire/solhint](https://github.com/protofire/solhint) and moved here with his
agreement, so the MCP server can be maintained and released independently of
Solhint's release cycle. See [NOTICE](NOTICE) for the file-level breakdown.

Solhint is maintained by [Protofire](https://protofire.io). This package depends on
it; it is not part of it.
