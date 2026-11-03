const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["example/**", "dist/**"],
  },
  {
    rules: {
      "object-property-newline": [
        "error",
        {
          allowAllPropertiesOnSameLine: false,
        },
      ],
      "object-curly-newline": [
        "error",
        {
          ObjectExpression: "always",
          ObjectPattern: {
            minProperties: 2,
            multiline: true,
          },
        },
      ],
      "react/jsx-max-props-per-line": [
        "error",
        {
          maximum: 1,
          when: "always",
        },
      ],
      "react/jsx-first-prop-new-line": ["error", "always"],
      "react/jsx-closing-bracket-location": ["error", "tag-aligned"],
      "react/jsx-indent-props": ["error", 2],
      indent: [
        "error",
        2,
        {
          SwitchCase: 1,
          ignoredNodes: [
            "JSXElement",
            "JSXElement *",
            "JSXFragment",
            "JSXFragment *",
          ],
        },
      ],
    },
  },
]);
