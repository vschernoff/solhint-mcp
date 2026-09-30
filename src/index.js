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
      instructions:
        'Lints and autofixes Solidity with Solhint. ' +
        'Run lint_file or lint_project before treating Solidity work as finished; ' +
        'a contract that compiles can still carry security and gas problems this catches. ' +
        'Use fix_solidity or fix_file to apply the fixes Solhint can make itself rather ' +
        'than editing those by hand — fix_file previews by default and only writes when ' +
        'called with write: true. Use explain_rule to explain a violation before changing ' +
        'code to satisfy it. Report what remains after fixing; do not present a partial ' +
        'fix as a clean result. ' +
        `This server lints one project only, rooted at ${runner.projectRoot}; ` +
        'start another server process for a different project. ' +
        `${runner.describeResolution()}.`,
    }
  )

  for (const tool of TOOL_DEFINITIONS) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: fromJsonSchema(tool.inputSchema) },
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
