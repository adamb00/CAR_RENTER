// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

export default withNextIntl({
  images: {
    qualities: [75, 85],
  },
  experimental: {
    globalNotFound: true,
  },
  serverExternalPackages: ['pdfkit'],
});
