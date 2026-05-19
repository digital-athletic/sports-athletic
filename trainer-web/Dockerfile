FROM node:20.19.4

# Install pnpm
RUN corepack enable && \
    corepack prepare pnpm@10.25.0 --activate

# Install secretlint globally for Claude Code secret-scanning hooks
RUN npm install -g secretlint @secretlint/secretlint-rule-preset-recommend
