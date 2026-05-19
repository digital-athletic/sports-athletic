FROM node:20.19.4

WORKDIR /workspace

# folders to fix permission problems after volume mount
RUN mkdir -p /workspace/node_modules
RUN mkdir -p /workspace/.pnpm-store
RUN mkdir -p /workspace/athlete-mobile/node_modules 
RUN chown -R node:node /workspace

# Set environment variables
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Install pnpm
RUN corepack enable && \
    corepack prepare pnpm@10.25.0 --activate

# Install secretlint globally for Claude Code secret-scanning hooks
RUN npm install -g secretlint @secretlint/secretlint-rule-preset-recommend

# Expose ports
EXPOSE 8081 19000 19001 19002

