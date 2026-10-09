# solhint-mcp — MCP server exposing Solhint to AI coding agents.
#
# The server lints whatever project is its working directory, so mount the
# Solidity project at /project:
#
#   docker run -i --rm -v "$PWD":/project solhint-mcp
#
# It speaks MCP over stdio, so -i is required and no port is exposed.

FROM node:25-alpine

# Install production dependencies first so this layer is cached across source edits.
WORKDIR /opt/solhint-mcp
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src/ ./src/
COPY README.md LICENSE NOTICE ./

# The server resolves the project it lints from process.cwd(), and prefers a Solhint
# installed in that project over its own bundled copy. /project is where the caller's
# Solidity project is mounted; it is deliberately not /opt/solhint-mcp.
WORKDIR /project

# Run unprivileged. The node image ships a `node` user; it only needs to read the
# mounted project, plus write access when fix_file is called with write: true.
USER node

ENTRYPOINT ["node", "/opt/solhint-mcp/src/index.js"]
