import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // The React Compiler is not enabled. These rules flag existing mount
      // and fetch effects. They stay visible as warnings.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/use-memo": "warn",
    },
  },
  {
    ignores: ["tsconfig.tsbuildinfo", "**/*.bak", "**/*.bak.*"],
  },
];

export default eslintConfig;
