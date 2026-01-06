# Project Setup Guide

This guide provides instructions for setting up and running the project locally without Docker.

## Prerequisites
- Node.js 18+ (recommended to manage via nvm)
- pnpm (package manager for Node.js)

## Installation

### Install nvm (Node Version Manager)

Using nvm allows for easy management of multiple Node.js versions.

#### Linux/macOS

1. Install nvm:
```sh
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
```

2. Restart your terminal or run:
```sh
source ~/.bashrc
```

3. Install and use Node.js 18:
```sh
nvm install 18
nvm use 18
```

## Runnig the project locally

1. Clone the repository:
```sh
git clone <https://gitlab.cnpem.br/GCD/data-science/segmentation/annodocs.git>
cd <annodocs>
```

2. Install dependencies and build the project:
```sh
pnpm install
pnpm run build
```

### Development version

3. Start the development server:
```sh
pnpm dev
```

4. Open the URL provided in the terminal (e.g., http://localhost:4321) in your browser.

### Production version
3. Build the project for production:
```sh
pnpm build
```

4. Determine your host IP address:
```sh
hostname -I 
```

5. Start the production server, specifying the host from the previous step and port of your choice:
```sh
PORT=4322 HOST=172.17.0.1 pnpm start
```

4. Open the provided URL (e.g., http://172.17.0.1:4322) in your browser.
  

## Learn More

For further information, refer to the following resources:

- [Next.js Documentation](https://nextjs.org/docs) – Learn about Next.js features and APIs.
  features and API.
- [Learn Next.js](https://nextjs.org/learn) – Interactive Next.js tutorial.
- [Fumadocs](https://fumadocs.vercel.app) – Interactive Next.js tutorial.