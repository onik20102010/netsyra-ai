const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com blob:;
              style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com;
              img-src 'self' data: blob: https:;
              font-src 'self' data: https://cdn.jsdelivr.net https://unpkg.com;
              connect-src 'self' https:;
            `.replace(/\s{2,}/g, ' ')
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;