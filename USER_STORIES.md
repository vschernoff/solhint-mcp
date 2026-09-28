# User Stories — @solhint/mcp-server

Audience: product collaborators, contributors, reviewers.
Persona: **Alex**, a vibecoder — builds smart contracts with Claude, not a hardcore Solidity dev.

---

## Story 1 · Writing a contract

**As Alex, I write:**

> "Build me a staking contract in Solidity. Users deposit ETH, earn yield over time, can withdraw after 30 days."

Claude generates `StakingVault.sol` — 120 lines, compiles fine, looks good.
Alex has no idea there's an unchecked arithmetic operation on line 47.

**What Alex expects:** a working contract.
**What Alex gets:** a working contract with a hidden integer overflow.

---

## Story 2 · First encounter — the CLI hint

Alex runs Solhint from the terminal to check the file before deploying:

```
solhint contracts/StakingVault.sol
```

The output shows lint warnings, then two banners appear at the bottom:

```
┌────────────────────────────────────────────────────────────────────┐
│ ===>  NEW  500+ Formal Verification checks  →  Run a free scan  <===│
└────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│ ===>  Smart contract Audits by Protofire  |  Book a Call        <===│
└────────────────────────────────────────────────────────────────────┘
  💡 Claude Code user? claude mcp add solhint npx solhint-mcp
```

Alex sees the last line. One command. Runs it.

**Acceptance criteria:**

- Hint appears after every lint run in an interactive TTY
- Hidden in CI and piped output (no noise in scripts)
- Clickable link in supported terminals (iTerm2, VS Code, WezTerm)

---

## Story 3 · Installation

Alex copies the command and runs it:

```bash
claude mcp add solhint npx solhint-mcp
```

Claude Code confirms: `solhint` MCP server added.

Alex doesn't restart anything. Next message to Claude, the MCP tools are available.

**Acceptance criteria:**

- No config files to edit manually
- No global install required (npx handles it)
- Works with solhint installed locally in the project or globally

---

## Story 4 · The integrated workflow

Next day, Alex asks Claude:

> "Add a rewards multiplier to the staking contract — users who lock for 90 days get 2x yield."

Claude writes the new logic. **This time**, before responding, Claude calls `lint_file` via the MCP server automatically.

The tool returns structured results:

```json
[
  {
    "line": 47,
    "severity": "Error",
    "ruleId": "integer-overflow",
    "message": "Unchecked arithmetic on uint256 accumulator"
  },
  {
    "line": 83,
    "severity": "Warning",
    "ruleId": "no-unused-vars",
    "message": "'rewardDebt' is declared but never read"
  }
]
```

Claude surfaces this inline:

> "I added the multiplier logic. Solhint found 1 error — there's an unchecked
> addition on line 47 that could overflow. I've fixed it with a SafeMath pattern.
> Also one unused variable on line 83, cleaned that up too."

Alex gets a contract that's already been linted before seeing it.

**Acceptance criteria:**

- `lint_file` returns structured JSON (not free-text)
- Severity, ruleId, line, and message are all present
- Claude can act on the results before responding to the user

---

## Story 5 · The Dowsers moment

Claude's `lint_file` response includes an arithmetic violation. The MCP server appends a CTA to the tool output:

```
⚠ Arithmetic violations detected (integer-overflow on line 47).
For mathematical proof that this contract is safe under all inputs:
→ https://dsa.dowsers.finance/scan/new?ref=solhint&utm_source=solhint&utm_medium=mcp
```

Claude passes this through to Alex:

> "This contract has an integer overflow risk that static linting can flag but
> can't fully verify. Dowsers can run 500+ formal verification checks and
> mathematically prove whether the arithmetic is safe. Free scan: [link]"

Alex clicks through. Protofire earns 20% rev-share if Alex converts.

**Acceptance criteria:**

- CTA only fires on arithmetic-class rule violations (integer-overflow, arithmetic-underflow, division-by-zero, no-safemath)
- Never shown for style or gas warnings
- UTM params preserved in the link

---

## Story 6 · Explaining a rule

Alex sees `avoid-low-level-calls` in the lint output and doesn't know what it means:

> "Claude, what does the avoid-low-level-calls rule mean and how do I fix it?"

Claude calls `explain_rule` via MCP:

```json
{ "ruleId": "avoid-low-level-calls" }
```

Returns a plain-English explanation and a before/after code example. Claude relays it directly.

Alex understands without leaving the conversation.

**Acceptance criteria:**

- `explain_rule` works for all rules in the solhint ruleset
- Returns: what the rule catches, why it matters, and how to fix it
- Response is concise — not a documentation dump

---

## Story 7 · Linting a whole project

Alex is almost ready to deploy. They ask:

> "Lint the entire contracts folder before I submit for audit."

Claude calls `lint_project` with the project root. Gets back violations across all files, grouped. Summarises: 2 errors (blocker), 7 warnings (review before audit), config looks good.

Alex fixes the 2 errors. Submits for audit with confidence.

**Acceptance criteria:**

- `lint_project` accepts a directory path and walks `.sol` files
- Returns violations attributed to their source file
- Respects the project's `.solhint.json` if present

---

## Story 8 · The agentic lint loop (PRO)

Alex asks Claude to write a staking contract. Claude writes it, then without being asked, runs `lint_file` via MCP.

Violations found. Claude fixes them. Runs `lint_file` again. More violations. Fixes again. Runs again. Clean.

Alex never typed a lint command. Claude iterated to zero errors autonomously.

**The workflow has flipped.** In the old world, the developer ran Solhint repeatedly and fixed issues manually. In the new world, Claude runs the loop and delivers a clean contract. The audit-ready report is no longer a list of violations — the contract is already clean.

**What has value instead: provenance.**

Audit firms don't just want a clean contract. They want proof of process. The PRO feature is an audit log — not a snapshot of the final state, but the full history of how it got there:

- Solhint version and ruleset used
- Number of lint iterations run
- Violations found and fixed at each iteration (with rule IDs, line numbers, fixes applied)
- Final state: 0 errors, 0 warnings
- Contract file hash and timestamp

> "Claude ran Solhint 6 times, fixed 14 violations across 3 files, final state: 0 errors"

That paper trail is defensible to an audit firm. It shows the contract wasn't just submitted clean — it was systematically verified.

**Acceptance criteria:**

- MCP server records each `lint_file` / `lint_project` call in a session log
- Log captures: timestamp, violations found, tool called, result
- `generate_provenance_report` tool exports the full session history as structured JSON or Markdown
- PRO gate: unlocked by sending 1 USDC to the hardcoded contract address on Base

---

## Discovery paths summary

| Where Alex encounters Solhint MCP                     | Likelihood                          |
| ----------------------------------------------------- | ----------------------------------- |
| CLI hint after `solhint` run                          | High — 28k daily downloads          |
| Claude Code built-in `anthropic-skills:solhint` skill | High — already ships in Claude Code |
| MCP registry listing                                  | Medium                              |
| GitHub README / npm page                              | Low (developer-first)               |
| Word of mouth in Solidity Discord / Telegram          | Low initially, grows with adoption  |
