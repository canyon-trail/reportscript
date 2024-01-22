module.exports = {
  "*.(tsx|ts)": (files) => {
    const prettify = files.map(x => `prettier --check --write ${x}`);
    const lint = files.map(x => `eslint ${x}`);

    return [...prettify, ...lint];
  },
}