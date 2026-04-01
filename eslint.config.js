const { defineConfig } = require("eslint/config");

// Root workspace config — each sub-package (athlete-mobile, trainer-web) has its own config.
module.exports = defineConfig([{ ignores: ["**/*"] }]);
