import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// paths
const rootDist = path.join(__dirname, "..", "dist");
const uiDist = path.join(__dirname, "..", "apps", "ui", "dist");
const pyDist = path.join(__dirname, "..", "apps", "server", "dist");

function copyFolder(src, dest) {
  if (!fs.existsSync(src)) return;

  fs.mkdirSync(dest, { recursive: true });

  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolder(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// clear old dist
if (fs.existsSync(rootDist)) {
  fs.rmSync(rootDist, { recursive: true, force: true });
}

// merge
copyFolder(uiDist, rootDist);
copyFolder(pyDist, rootDist);

fs.copyFileSync("install.sh", path.join(rootDist, "install.sh"));
fs.copyFileSync("uninstall.sh", path.join(rootDist, "uninstall.sh"));
fs.copyFileSync("start.sh", path.join(rootDist, "start.sh"));
fs.copyFileSync("tunehubd.service", path.join(rootDist, "tunehubd.service"));

console.log("Merged UI + Python dist into /dist");
