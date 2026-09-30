const { execSync } = require('child_process')

const entries = []

function recordLint({ tool, target, violationCount }) {
  const targetKey = target || 'inline'
  const iteration = entries.filter((e) => e.target === targetKey).length + 1
  entries.push({
    timestamp: new Date().toISOString(),
    tool,
    target: targetKey,
    violationCount,
    iteration,
  })
}

function getSolhintVersion() {
  try {
    return execSync('npx solhint --version 2>/dev/null', { encoding: 'utf8' }).trim()
  } catch {
    // version check failed — non-fatal
    return 'unknown'
  }
}

function buildProvenanceReport() {
  const targets = [...new Set(entries.map((e) => e.target))]
  const lastEntry = entries[entries.length - 1] || null

  return {
    generatedAt: new Date().toISOString(),
    solhintVersion: getSolhintVersion(),
    totalIterations: entries.length,
    targets,
    history: entries,
    finalState: lastEntry
      ? { violationCount: lastEntry.violationCount, clean: lastEntry.violationCount === 0 }
      : null,
  }
}

module.exports = { recordLint, buildProvenanceReport }
