FROM node:20.19.4

WORKDIR /workspace

# Set environment variables
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Install pnpm
RUN corepack enable && \
    corepack prepare pnpm@10.25.0 --activate

# Expose ports
EXPOSE 8081 19000 19001 19002

