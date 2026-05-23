const fs = require('fs');
const path = require('path');

const root = process.cwd();
const clientDir = path.join(root, 'node_modules', '@prisma', 'client');
const prismaLink = path.join(clientDir, '.prisma');

function ensurePrismaLink() {
  if (!fs.existsSync(clientDir)) {
    throw new Error(`Missing Prisma client directory: ${clientDir}`);
  }

  const realClientDir = fs.realpathSync(clientDir);
  const prismaTarget = path.resolve(realClientDir, '..', '..', '.prisma');

  if (!fs.existsSync(prismaTarget)) {
    throw new Error(
      `Missing generated Prisma output: ${prismaTarget}. Run "pnpm prisma generate" first.`
    );
  }

  try {
    const stat = fs.lstatSync(prismaLink);
    if (stat.isSymbolicLink()) {
      const currentTarget = fs.readlinkSync(prismaLink);
      const resolvedCurrent = path.resolve(clientDir, currentTarget);
      if (resolvedCurrent === prismaTarget) {
        return;
      }
    }
    fs.rmSync(prismaLink, { recursive: true, force: true });
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error;
  }

  fs.symlinkSync(prismaTarget, prismaLink, 'dir');
}

ensurePrismaLink();
