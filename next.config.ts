// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(); // alapbeállítás: gyökérben keresi a next-intl.config.ts-t

export default withNextIntl({
  // ide jöhet más Next config is
});
