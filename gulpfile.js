const gulp = require("gulp");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const archiver = require("archiver");
const stringify = require("json-stringify-pretty-compact");
const typescript = require("typescript");

const ts = require("gulp-typescript");
const less = require("gulp-less");
// const sass = require("gulp-sass");
const sass = require('gulp-sass')(require('sass'));
const git = require("gulp-git");

const argv = require("yargs").argv;

sass.compiler = require("sass");
const mkdirp = require('mkdirp');

function getConfig() {
  console.log("Starting getConfig...")
  const configPath = path.resolve(process.cwd(), "foundryconfig.json");
  let config;

  if (fs.existsSync(configPath)) {
    config = fs.readJSONSync(configPath);
    return config;
  } else {
    return;
  }
}

function getManifest() {
  console.log("Starting getManifest...")
  const json = {};

  if (fs.existsSync("src")) {
    json.root = "src";
  } else {
    json.root = "dist";
  }

  const modulePath = path.join(json.root, "module.json");
  const systemPath = path.join(json.root, "system.json");

  if (fs.existsSync(modulePath)) {
    json.file = fs.readJSONSync(modulePath);
    json.name = "module.json";
  } else if (fs.existsSync(systemPath)) {
    json.file = fs.readJSONSync(systemPath);
    json.name = "system.json";
  } else {
    return;
  }

  console.log("End getManifest...")
  return json;
}

/**
 * TypeScript transformers
 * @returns {typescript.TransformerFactory<typescript.SourceFile>}
 */
function createTransformer() {
  /**
   * @param {typescript.Node} node
   */
  function shouldMutateModuleSpecifier(node) {
    if (
      !typescript.isImportDeclaration(node) &&
      !typescript.isExportDeclaration(node)
    )
      return false;
    if (node.moduleSpecifier === undefined) return false;
    if (!typescript.isStringLiteral(node.moduleSpecifier)) return false;
    if (
      !node.moduleSpecifier.text.startsWith("./") &&
      !node.moduleSpecifier.text.startsWith("../")
    )
      return false;
    if (path.extname(node.moduleSpecifier.text) !== "") return false;
    return true;
  }

  /**
   * Transforms import/export declarations to append `.js` extension
   * @param {typescript.TransformationContext} context
   */
  function importTransformer(context) {
    return node => {
      /**
       * @param {typescript.Node} node
       */
      function visitor(node) {
        if (shouldMutateModuleSpecifier(node)) {
          if (typescript.isImportDeclaration(node)) {
            const newModuleSpecifier = typescript.createLiteral(
              `${node.moduleSpecifier.text}.js`
            );
            return typescript.updateImportDeclaration(
              node,
              node.decorators,
              node.modifiers,
              node.importClause,
              newModuleSpecifier
            );
          } else if (typescript.isExportDeclaration(node)) {
            const newModuleSpecifier = typescript.createLiteral(
              `${node.moduleSpecifier.text}.js`
            );
            return typescript.updateExportDeclaration(
              node,
              node.decorators,
              node.modifiers,
              node.exportClause,
              newModuleSpecifier
            );
          }
        }
        return typescript.visitEachChild(node, visitor, context);
      }

      return typescript.visitNode(node, visitor);
    };
  }

  return importTransformer;
}

const tsConfig = ts.createProject("tsconfig.json", {
  getCustomTransformers: prgram => ({
    after: [createTransformer()]
  })
});

/********************/
/*		BUILD		*/
/********************/

/**
 * Build TypeScript
 */
function buildTS() {
  console.log("Starting buildTS...")
  return gulp
    .src("src/**/*.ts")
    .pipe(tsConfig())
    .pipe(gulp.dest("dist"));
}

/**
 * Build Less
 */
function buildLess() {
  console.log("Starting buildLess...")
  return gulp
    .src("src/*.less")
    .pipe(less())
    .pipe(gulp.dest("dist"));
}

/**
 * Build SASS
 */
function buildSASS() {
  console.log("Starting buildSASS...")
  return gulp
    .src("src/scss/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("dist"))
    .pipe(gulp.dest("src"));
}

/**
 * Copy static files
 */
async function copyFiles() {
  console.log("Starting copyFiles...")
  const statics = [
    "lang",
    "fonts",
    "icons",
    "assets",
    "templates",
    "module",
    // "packs",
    "sounds",
    "ui",
    "module.json",
    "system.json",
    "template.json",
    "ARS-COMPATIBILITY.md",
  ];

  // const rulesDocPath = '/FoundryVTT/Data/worlds/buildrulesetdocumentation/packs';
  // const rulesDocFile = 'ruleset-documentation';

  const rulesDocPath = '/FoundryVTT/Development/modules/advanced-roleplay-system-documentation/packs';
  const rulesDocFile = 'ruleset-documentation';

  try {
    for (const file of statics) {
      if (fs.existsSync(path.join("src", file))) {
        console.log(`Copying ${path.join("src", file)} to ${path.join("dist", file)}`)
        await fs.copy(path.join("src", file), path.join("dist", file));
      }
    }
    // get docs there
    if (fs.existsSync(path.join(rulesDocPath, rulesDocFile))) {
      // await fs.copy(path.join(rulesDocPath, rulesDocFile), path.join("src/packs", rulesDocFile));
      await fs.copy(path.join(rulesDocPath, rulesDocFile), path.join("dist/packs", rulesDocFile));
    }

    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
  // we do this outside the try/catch cause we work on stuff live and we don't care if it can't copy the files
  // because the system is currently locked.
  if (fs.existsSync(path.join(rulesDocPath, rulesDocFile))) {
    await fs.copy(path.join(rulesDocPath, rulesDocFile), path.join("src/packs", rulesDocFile));
  }

  console.log("End copyFiles...")
}

/**
 * Watch for changes for each build step
 */
function buildWatch() {
  console.log("Starting buildWatch...")
  gulp.watch("src/**/*.ts", { ignoreInitial: false }, buildTS);
  gulp.watch("src/**/*.less", { ignoreInitial: false }, buildLess);
  gulp.watch("src/**/*.scss", { ignoreInitial: false }, buildSASS);
  gulp.watch(
    ["src/fonts", "src/templates", "src/*.json", "src/**/*.js"],
    { ignoreInitial: false },
    copyFiles
  );
  console.log("End buildWatch...")
}

/********************/
/*		CLEAN		*/
/********************/

/**
 * Remove built files from `dist` folder
 * while ignoring source files
 */
async function clean() {
  console.log("Starting clean...")
  const name = path.basename(path.resolve("."));
  const files = [];

  // If the project uses TypeScript
  if (fs.existsSync(path.join("src", `${name}.ts`))) {
    files.push(
      "lang",
      "templates",
      "assets",
      "packs",
      "module",
      `${name}.js`,
      "module.json",
      "system.json",
      "template.json",
      "ARS-COMPATIBILITY.md",
    );
  }

  // If the project uses Less or SASS
  if (
    fs.existsSync(path.join("src", `${name}.less`)) ||
    fs.existsSync(path.join("src", `${name}.scss`))
  ) {
    files.push("fonts", `${name}.css`);
  }

  console.log(" ", chalk.yellow("Files to clean:"));
  console.log("   ", chalk.blueBright(files.join("\n    ")));

  // Attempt to remove the files
  try {
    for (const filePath of files) {
      await fs.remove(path.join("dist", filePath));
    }
    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
  console.log("End clean...")
}

/********************/
/*		LINK		*/
/********************/

/**
 * Link build to User Data folder
 */
async function linkUserData() {
  console.log("Starting linkUserData...")
  const name = path.basename(path.resolve("."));
  const config = fs.readJSONSync("foundryconfig.json");

  let destDir;
  try {
    if (
      fs.existsSync(path.resolve(".", "dist", "module.json")) ||
      fs.existsSync(path.resolve(".", "src", "module.json"))
    ) {
      destDir = "modules";
    } else if (
      fs.existsSync(path.resolve(".", "dist", "system.json")) ||
      fs.existsSync(path.resolve(".", "src", "system.json"))
    ) {
      destDir = "systems";
    } else {
      throw Error(
        `Could not find ${chalk.blueBright(
          "module.json"
        )} or ${chalk.blueBright("system.json")}`
      );
    }

    let linkDir;
    if (config.dataPath) {
      if (!fs.existsSync(path.join(config.dataPath, "Data")))
        throw Error("User Data path invalid, no Data directory found");

      linkDir = path.join(config.dataPath, "Data", destDir, name);
    } else {
      throw Error("No User Data path defined in foundryconfig.json");
    }

    if (argv.clean || argv.c) {
      console.log(
        chalk.yellow(`Removing build in ${chalk.blueBright(linkDir)}`)
      );

      await fs.remove(linkDir);
    } else if (!fs.existsSync(linkDir)) {
      console.log(chalk.green(`Copying build to ${chalk.blueBright(linkDir)}`));
      await fs.symlink(path.resolve("./dist"), linkDir);
    }
    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
  console.log("End linkUserData...")
}

/*********************/
/*		PACKAGE		 */
/*********************/

/**
 * Package build
 */
async function packageBuild() {
  console.log("Starting packageBuild...")
  const manifest = getManifest();
  const packagePath = `package/v${manifest.file.version}`;

  try {

    // Remove the package dir without doing anything else
    if (argv.clean || argv.c) {
      console.log(chalk.yellow("Removing all packaged files"));
      await fs.remove("package");
      return;
    }

    // Ensure there is a directory to hold all the packaged versions
    // await fs.ensureDir("package");
    console.log("packagePath:", packagePath)
    try {
      mkdirp.sync(packagePath);
    } catch (err) {
      console.error(`In packageBuild trying to create package path: ${err}`);
    }


    // Initialize the zip file
    // console.log("manifest.file.id:", manifest.file.id)
    // console.log("manifest:", { manifest }, manifest.file.id)
    const zipName = `${manifest.file.id}-v${manifest.file.version}.zip`;
    const zipFile = fs.createWriteStream(path.join(packagePath, zipName));
    const zip = archiver("zip", { zlib: { level: 9 } });

    zipFile.on("close", () => {
      console.log(chalk.green(zip.pointer() + " total bytes"));
      console.log(chalk.green(`Zip file ${zipName} has been written`));
      return Promise.resolve();
    });

    zip.on("error", err => {
      throw err;
    });

    zip.pipe(zipFile);

    // Add the directory with the final code
    // zip.directory("dist/", manifest.file.id);
    zip.directory("dist/", '');

    zip.finalize();
  } catch (err) {
    Promise.reject(err);
  }

  try {
    await fs.copy("src/system.json", path.join(packagePath, "system.json"));
  } catch (err) {
    console.error(`In package trying to copy src/system.json: ${err}`)
  }

  // }
  console.log("End packageBuild...")
}

/*********************/
/*		PACKAGE		 */
/*********************/

/**
 * Update version and URLs in the manifest JSON
 */
function updateManifest(cb) {
  console.log("Starting updateManifest...")
  const packageJson = fs.readJSONSync("package.json");
  const config = getConfig(),
    manifest = getManifest(),
    rawURL = config.rawURL,
    repoURL = config.repository,
    manifestRoot = manifest.root;

  if (!config) cb(Error(chalk.red("foundryconfig.json not found")));
  if (!manifest) cb(Error(chalk.red("Manifest JSON not found")));
  if (!rawURL || !repoURL)
    cb(
      Error(chalk.red("Repository URLs not configured in foundryconfig.json"))
    );

  try {
    const version = argv.update || argv.u;

    /* Update version */

    const versionMatch = /^(\d{1,}).(\d{1,}).(\d{1,})$/;
    const currentVersion = manifest.file.version;
    let targetVersion = "";

    if (!version) {
      cb(Error("Missing version number"));
    }

    if (versionMatch.test(version)) {
      targetVersion = version;
    } else {
      targetVersion = currentVersion.replace(
        versionMatch,
        (substring, major, minor, patch) => {
          if (version === "major") {
            return `${Number(major) + 1}.0.0`;
          } else if (version === "minor") {
            return `${major}.${Number(minor) + 1}.0`;
          } else if (version === "patch") {
            return `${major}.${minor}.${Number(minor) + 1}`;
          } else {
            return "";
          }
        }
      );
    }

    if (targetVersion === "") {
      return cb(Error(chalk.red("Error: Incorrect version arguments.")));
    }

    if (targetVersion === currentVersion) {
      return cb(
        Error(
          chalk.red("Error: Target version is identical to current version.")
        )
      );
    }
    console.log(`Updating version number to '${targetVersion}'`);

    packageJson.version = targetVersion;
    manifest.file.version = targetVersion;

    /* Update URLs */

    // const result = `${rawURL}/main/v${manifest.file.version}/package/${manifest.file.id}-v${manifest.file.version}.zip`;
    const result = `${rawURL}/main/package/v${manifest.file.version}/${manifest.file.id}-v${manifest.file.version}.zip`;

    manifest.file.url = repoURL;
    manifest.file.manifest = `${rawURL}/main/${manifestRoot}/${manifest.name}`;
    manifest.file.download = result;

    const prettyProjectJson = stringify(manifest.file, { maxLength: 35 });

    fs.writeJSONSync("package.json", packageJson, { spaces: 2 });
    fs.writeFileSync(
      path.join(manifest.root, manifest.name),
      prettyProjectJson,
      "utf8"
    );

    return cb();
  } catch (err) {
    cb(err);
  }
  console.log("End updateManifest...")
}

function gitAdd() {
  console.log("Starting gitAdd...")
  return gulp.src("package").pipe(git.add({ args: "--no-all" }));
}

function gitCommit() {
  console.log("Starting gitCommit...")
  return gulp.src("./*").pipe(
    git.commit(`v${getManifest().file.version}`, {
      args: "-a",
      disableAppendPaths: true
    })
  );
}

function gitTag() {
  console.log("Starting gitTag...")
  const manifest = getManifest();
  return git.tag(
    `v${manifest.file.version}`,
    `Updated to ${manifest.file.version}`,
    err => {
      if (err) throw err;
    }
  );
}

const execGit = gulp.series(gitAdd, gitCommit, gitTag);

const execBuild = gulp.parallel(buildTS, buildLess, buildSASS, copyFiles);

exports.build = gulp.series(clean, execBuild);
exports.watch = buildWatch;
exports.clean = clean;
exports.link = linkUserData;
exports.package = packageBuild;
exports.publish = gulp.series(
  clean,
  updateManifest,
  execBuild,
  packageBuild,
  execGit
);
