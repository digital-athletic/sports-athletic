FROM node:24.22.1

WORKDIR /workspace

# Set environment variables
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Install pnpm (runs as root, writes to /usr/local)
RUN corepack enable

# Pre-create the named-volume mount points owned by node
RUN mkdir -p /workspace/.pnpm-store \
             /workspace/athlete-mobile/node_modules && \
    chown -R node:node /workspace

USER node

# Expose ports
EXPOSE 8081 19000 19001 19002
