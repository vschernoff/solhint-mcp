# Security policy

## Reporting a vulnerability

Report privately through GitHub:
**[open a security advisory](https://github.com/vschernoff/solhint-mcp/security/advisories/new)**.

Please do not open a public issue for a vulnerability.

Expect an acknowledgement within three working days and an assessment within ten. If a
fix is warranted it ships as a patch release, with a GitHub Security Advisory and a CVE
where one applies. Reporters are credited unless they ask not to be.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |

Only the latest published version receives fixes. The package is young and pre-1.0; there
are no long-term support branches.

## Known attack surface

This server runs inside an AI agent's session and executes code from the project it is
pointed at. That is an unusual combination, so the surface is documented here rather than
left implicit.

**Project-supplied Solhint plugins and shareable configs execute in this process.** Solhint
resolves them relative to `process.cwd()` and loads them with `require`. Pointing the
server at an untrusted repository therefore runs that repository's JavaScript with the
privileges of the server process — the same exposure as running `npx solhint` in that
directory, but reached automatically by an agent rather than deliberately by a person.

Mitigations in place today:

- A plugin writing synchronously to stdout is redirected to stderr during linting, so it
  cannot corrupt the MCP channel.
- Solhint 6.0.x is excluded: its plugin loader can terminate the host process when a
  configured plugin fails to load.

Not yet addressed, and tracked as the next substantial piece of work:

- Plugin isolation in a worker, with lint timeouts and cancellation.
- Resource limits on a single lint run.

Until that lands, **treat the server's working directory as trusted input**: point it at
repositories you would be willing to run `npm install && npx solhint` in.

## What this tool does not do

Solhint is a linter, not a security analyser. A clean result is not evidence that a
contract is safe, and this server does not change that. Do not use a passing lint as an
audit substitute.
