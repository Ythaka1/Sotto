/*
 * Moves the compiled lib modules next to their tests and rewrites the "@/lib/x"
 * aliases to relative paths, so node --test runs the code that ships instead of
 * a second hand written copy of it.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = '.testbuild';
for (const file of readdirSync(OUT).filter((f) => f.endsWith('.js'))) {
  const name = file.replace(/\.js$/, '');
  const src = readFileSync(`${OUT}/${file}`, 'utf8').replace(
    /from ['"]@\/lib\/([\w-]+)['"]/g,
    "from './$1.compiled.mjs'",
  );
  writeFileSync(`lib/${name}.compiled.mjs`, src);
}
