import baseConfig from "../../lint-staged.config.js";

/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  ...baseConfig,
  "*.{jsx,tsx,ts,js,graphql}": [
    (filenames) => `pnpm exec eslint --cache --fix ${filenames.map((f) => `"${f}"`).join(" ")}`,
    "prettier --write",
  ],
};
