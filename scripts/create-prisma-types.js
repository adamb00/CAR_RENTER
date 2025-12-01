const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  process.cwd(),
  'node_modules',
  'prisma',
  'build',
  'types.js'
);

try {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, 'module.exports = {};\n', { flag: 'wx' });
} catch (error) {
  // Ignore: target already exists or path unavailable.
}
