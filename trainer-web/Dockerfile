FROM node:24.18.0

WORKDIR /workspace

# Install pnpm (runs as root, writes to /usr/local)
RUN corepack enable

# Pre-create the named-volume mount points owned by node
RUN mkdir -p /workspace/.pnpm-store \
             /workspace/trainer-web/node_modules && \
    chown -R node:node /workspace

USER node
