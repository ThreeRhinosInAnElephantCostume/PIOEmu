import { nodeResolve } from "@rollup/plugin-node-resolve";
export default {
  input: "./build/public/JS/editor.js",
  output: {
    file: "./build/public/JS/editor.bundle.js",
    format: "iife",
  },
  plugins: [nodeResolve()],
};
