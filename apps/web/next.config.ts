import createMDX from '@next/mdx';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from "next";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(webRoot, '../..');

// API URL from environment (defaults to localhost:38473 for local dev)
const nextConfig: NextConfig = {
  /* config options here */

  reactCompiler: true,
  turbopack: {
    root: workspaceRoot,
  },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  serverExternalPackages: [],
  // Disable response buffering for SSE
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Accel-Buffering', value: 'no' },
          { key: 'Cache-Control', value: 'no-cache, no-transform' },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.mdx$/,
  options: {
    // Use string-based plugin definition for Turbopack compatibility
    remarkPlugins: [["remark-gfm", { strict: true, throwOnError: true }]],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
