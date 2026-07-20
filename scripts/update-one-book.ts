import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const args = process.argv.slice(2);
  const slug = args[0];
  const data = JSON.parse(args[1]);
  await p.book.updateMany({ where: { slug }, data });
  console.log(`Updated: ${slug}`);
  await p.$disconnect();
}
main();
