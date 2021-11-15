import { nodeResolve } from "@rollup/plugin-node-resolve";
export default {
  input: "./public/JS/editor.js",
  output: {
    file: "./public/JS/editor.bundle.js",
    format: "iife",
  },
  plugins: [nodeResolve()],
};
