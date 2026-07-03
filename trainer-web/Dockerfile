FROM node:20.19.4

WORKDIR /workspace

# Install pnpm (runs as root, writes to /usr/local)
RUN corepack enable && \
    corepack prepare pnpm@10.25.0 --activate

# Pre-create the named-volume mount points owned by node
RUN mkdir -p /workspace/node_modules \
             /workspace/.pnpm-store \
             /workspace/trainer-web/node_modules && \
    chown -R node:node /workspace

USER node
