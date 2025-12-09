/**
 * This file was originally a Dockerfile with a .tsx extension, which caused TypeScript parsing errors.
 * To resolve this while preserving the content, the Dockerfile instructions have been embedded
 * within a React component as a string literal. This makes the file syntactically valid TypeScript/JSX.
 */
import React from 'react';

const DockerfileContent: React.FC = () => {
  const dockerfile = `# Stage 1: Build the React frontend
FROM node:20.10.0-alpine AS frontend-builder
WORKDIR /app

# Copy package files from the 'frontend' directory
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend application code
COPY frontend/ .

# Build the frontend application
RUN npm run build

# Stage 2: Final production image
FROM nginx:alpine

# Copy the build output from the builder stage to Nginx
COPY --from=frontend-builder /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]`;

  return (
    <pre>
      <code>{dockerfile}</code>
    </pre>
  );
};

export default DockerfileContent;
