"use strict";

const ck = require("chalker");
const common = require("./common");
const fs = require("fs");
const path = require("path");

const nvmrcFileName = ".nvmrc";

function isValidNodeVersion(version) {
  return /^v?\d+(\.\d+)*$/.test(version);
}

async function getNodeVersionFromNvmrcFile() {
  const filePath = path.join(process.cwd(), nvmrcFileName);
  let version = null;
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf-8");
    version = data;
  } else {
    common.log(ck`<red>No ${nvmrcFileName} file found</>`);
    common.exit(1);
  }
  return version;
}

module.exports = async function(ver, ignoreTmp) {
  if (!ver) {
    ver = await getNodeVersionFromNvmrcFile();
    if(isValidNodeVersion(ver)) {
      ver = ver?.replace("v", "").trim();
    } else {
      common.log(ck`<red>Invalid version: <white>${ver}</>.</>`);
      common.exit(1);
    }
  }

  const { version, nodeDir } = await common.findNodeVersion(ver);

  if (ignoreTmp !== true) {
    await common.resetNvmPaths();
    common.setNvmUsePath(nodeDir);
    process.env.NVM_USE = version;
    await common.createEnvironmentTmp();
  }
  common.log(ck`<green>Now using node <white>${version}</>.</>`);

  return { version, nodeDir };
};
