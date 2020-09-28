const path =require("path");
const rollupTypescript =require("rollup-plugin-typescript2");
const babel =require("rollup-plugin-babel");
const commonjs =require("rollup-plugin-commonjs");
const resolve =require("rollup-plugin-node-resolve");

const { name } =require("./package.json");

const paths = [
    path.join(__dirname, "/src/index.ts"), // input
    path.join(__dirname, "/lib"), // output
];

// rollup 配置项
const rollupConfig = {
    input: paths[0],
    output: [
        // 输出 commonjs 规范的代码
        {
            file: path.join(paths[1], "index.js"),
            format: "cjs",
            name: name,
        },
        // 输出 es 规范的代码
        {
            file: path.join(paths[1], "index.esm.js"),
            format: "es",
            name: name,
        },
    ],
    // external: ['lodash'], // 指出应将哪些模块视为外部模块，如 Peer dependencies 中的依赖
    // plugins 需要注意引用顺序
    plugins: [
        // 使得 rollup 支持 commonjs 规范，识别 commonjs 规范的依赖
        commonjs(),

        // 配合 commnjs 解析第三方模块
        resolve({
            // 将自定义选项传递给解析插件
            customResolveOptions: {
                moduleDirectory: "node_modules",
            },
        }),
        rollupTypescript(),
        babel({
            runtimeHelpers: true,
            // 只转换源代码，不运行外部依赖
            exclude: "node_modules/**",
            // babel 默认不支持 ts 需要手动添加
            extensions: [".js", ".ts"],
        }),
    ],
};

module.exports = rollupConfig;