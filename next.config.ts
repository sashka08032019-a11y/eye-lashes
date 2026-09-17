import type { NextConfig } from "next";

/**
 * Постоянный редирект с корня на локаль по умолчанию.
 * Выполняется на уровне сервера (308) — поисковые роботы видят редирект,
 * а не пустую страницу-заглушку.
 */
const nextConfig: NextConfig = {
  trailingSlash: false,
  async redirects() {
    return [{ source: "/", destination: "/ru", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
