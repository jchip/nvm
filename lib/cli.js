"use strict";

/* eslint-disable global-require */

const opfs = require("opfs");
opfs._opfsSetPromise(); // use native promise for opfs
const fs = require("fs");
const NixClap = require("nix-clap");
const Path = require("path");
const ck = require("chalker");
const common = require("./common");

const packageConfig = JSON.parse(
  fs.readFileSync(Path.join(__dirname, "../package.json")).toString()
);

const options = {
  proxy: {
    desc: "Set network proxy URL",
    alias: "p",
    type: "string"
  },
  verifyssl: {
    desc: "Turn on/off verify SSL certificate",
    alias: ["ssl", "no-ssl"],
    type: "boolean",
    default: true
  },
  latest: {
    desc: "Match latest version to uninstall"
  }
};

const checkOpts = parsed => {
  const proxy = parsed.source.proxy === "cli" ? parsed.opts.proxy : process.env.NVM_PROXY;
  const verifyssl =
    process.env.NVM_VERIFY_SSL === undefined || parsed.source.verifyssl === "cli"
      ? parsed.opts.verifyssl
      : process.env.NVM_VERIFY_SSL !== "false";

  return { proxy, verifyssl };
};

const commands = {
  install: {
    desc: "install the given version of Node.js",
    args: "<version>",
    exec: async parsed => {
      const { proxy, verifyssl } = checkOpts(parsed);
      await require("./install").cmdInstall(parsed.args.version, proxy, verifyssl);
    }
  },
  uninstall: {
    desc: "uninstall the given version of Node.js",
    args: "<version>",
    exec: parsed => {
      require("./uninstall")(parsed.args.version, parsed.opts);
    }
  },
  use: {
    desc: "use the given version of Node.js in current shell",
    requireArg: false,
    args: "<version>",
    exec: parsed => {
      require("./use")(parsed.args.version);
    }
  },
  stop: {
    desc: "undo effects of nvm in current shell",
    alias: "unuse",
    exec: () => {
      require("./deactivate")();
    }
  },
  link: {
    desc: "permanently link the version of Node.js as default",
    args: "<version>",
    exec: parsed => {
      require("./switch")(parsed.args.version);
    }
  },
  unlink: {
    desc: "permanently unlink the default version",
    exec: () => {
      require("./switch-deactivate")();
    }
  },
  ls: {
    desc: "list all the installed Node.js versions",
    exec: () => {
      require("./ls").local();
    }
  },
  "ls-remote": {
    desc: "list remote versions available for install",
    exec: parsed => {
      const { proxy, verifyssl } = checkOpts(parsed);
      require("./ls").remote(proxy, verifyssl);
    }
  },
  cleanup: {
    desc: "remove stale local caches",
    exec: () => {
      require("../lib/cleanup")();
    }
  },
  postinstall: {
    desc: "Invoke custom post install script for the given version",
    args: "[version]",
    exec: async parsed => {
      require("../lib/post-install")(parsed.args.version);
    }
  },
  "init-env": {
    desc: "(windows) Generate cmd file to initialize env for nvm",
    exec: async parsed => {
      await common.initEnv();
    }
  },
  "undo-env": {
    desc: "(windows) Generate cmd file to undo env for nvm",
    exec: async parsed => {
      await common.undoEnv();
    }
  }
};

new NixClap({
  name: "nvm",
  handlers: {
    "post-help": evt => {
      evt.self.output(ck`envs:

  <green>NVM_PROXY</> - set proxy URL
  <green>NVM_VERIFY_SSL</> - (true/false) turn on/off verify SSL certs

Examples:

    nvm install 18.8
    nvm use 18
    nvm uninstall 18.4

doc: https://www.npmjs.com/package/@jchip/nvm

`);
    }
  }
})
  .version(packageConfig.version)
  .usage("$0 <command> [options]")
  .init(options, commands)
  .parse();
