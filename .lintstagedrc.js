module.exports = {
  "*.(tsx|ts)": (files) => {
    const prettify = files.map(x => `prettier --check --write ${x}`);
    const lint = files.map(x => `eslint ${x}`);

    let commands = [...prettify, ...lint];

    if (files.find(x => x.match(/index.ts/)) || files.find(x => x.match(/types.ts/))) {
      commands = [
        "npm run build-docs",
        ...commands
      ]
    }

    return commands;
  },
}