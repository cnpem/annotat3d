import createMDX from 'fumadocs-mdx/config';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/docs',
        permanent: false, // or true if you want a permanent redirect
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/docs',
      },
    ];
  }
};

export default withMDX(config);