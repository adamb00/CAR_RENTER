// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(); // alapbeállítás: gyökérben keresi a next-intl.config.ts-t

export default withNextIntl({
  images: {
    qualities: [75, 85],
  },
  experimental: {
    globalNotFound: true,
  },
});
