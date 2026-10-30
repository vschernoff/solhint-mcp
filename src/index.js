#!/usr/bin/env node

const { fromJsonSchema, McpServer } = require('@modelcontextprotocol/server')
const { serveStdio } = require('@modelcontextprotocol/server/stdio')

const packageJson = require('../package.json')
const { createSolhintRunner } = require('./solhint-runner')
const { TOOL_DEFINITIONS, createToolService } = require('./tools')

function createServer({ runner }) {
  const service = createToolService({ runner })
  const server = new McpServer(
    { name: packageJson.name, version: packageJson.version },
    {
      // Codex and other clients read this as server-wide guidance and may only keep
      // the first ~512 characters, so the actionable part comes first and the paths
      // — which are long and tell the model nothing — come last.
      // Some clients keep only the first ~512 characters of this field, so it is a fixed
      // string with nothing interpolated: it must not change length with the project path.
      // Which Solhint is in use, and where, is prefixed to every tool result instead.
      instructions:
        'Lints and autofixes Solidity with Solhint. ' +
        'Run lint_file or lint_project before treating Solidity work as finished: it ' +
        'catches style, gas and some security issues the compiler does not. ' +
        'It is a linter, not a security analyser — a clean result does not prove safety. ' +
        'Prefer fix_solidity or fix_file over hand edits; fix_file previews unless ' +
        'write: true. ' +
        'Report what remains; never present a partial fix as clean, and never silence a ' +
        'finding with solhint-disable or a loosened .solhint.json unless asked.',
    }
  )

  for (const tool of TOOL_DEFINITIONS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: fromJsonSchema(tool.inputSchema),
        annotations: tool.annotations,
      },
      async (args) => service.call(tool.name, args)
    )
  }

  return server
}

function main() {
  try {
    const runner = createSolhintRunner({
      forceBundled: process.argv.includes('--bundled-solhint'),
      projectRoot: process.cwd(),
    })
    serveStdio(() => createServer({ runner }))
  } catch (error) {
    console.error(`Failed to start ${packageJson.name}: ${error.message}`)
    process.exitCode = 1
  }
}

if (require.main === module) main()

module.exports = { createServer, main }
