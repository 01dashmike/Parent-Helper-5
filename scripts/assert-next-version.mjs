
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));

const want = "15.1.6"; // Must match package.json dependencies.next

const have = (pkg.dependencies?.next || pkg.devDependencies?.next || "").replace(/^[^\d]*/,"");

if (have && have !== want) {

  console.error(`[guard] Next expected ${want} but package.json has ${have}.`);

  process.exit(1);

}

