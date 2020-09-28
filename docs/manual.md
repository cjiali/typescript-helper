# 搭建 Typescript 工具库

日常开发中总是有许多通用的工具方法、业务功能，因而可以搭建一个工具库来给各个项目使用。

### 主要涉及的库

- typescript
- rollup
- @microsoft/api-extractor
- jest
- eslint+prettier
- husky+lint-staged
- conventional-changelog
- gulp
- codecov

## 项目初始化

> 后续对 `*.json` 文件使用以下注释规范：
>
> 1、使用`"//[index]":"注释内容"`作为分段注释，其中`index`为可选标记，从该位置到下一个分段注释位置是其注释影响的范围
>
> 2、使用字段key加前缀`"#key":"注释内容"`做属性注释，其中 `key`为属性，而该属性也即概述的影响范围

新建一个项目目录如 `yarn-helper` , 并初始化项目。

```bash
mkdir typescript-helper && cd typescript-helper
git init && echo "# Typescript Helper" >> README.md
yarn init && echo "node_modules/" >> .gitignore
```



### 配置 [TypeScript](https://www.tslang.cn/docs/home.html)

---

**安装依赖库**

```shell
yarn add --dev typescript 
# 或者
npm install -d typescript
```

**创建文件（夹）**

```bash
mkdir src && touch src/index.ts && touch tsconfig.json
```

**目录概览**

```
typescript-helper  
 |- src
      |- index.ts
 |- tsconfig.json
```

**编辑 `tsconfig.json` 文件**

```json
{
    "compilerOptions": {
        // 基础配置
        "target": "esnext",
        "lib": ["dom", "esnext"],
        "removeComments": false,
        "declaration": true,
        "sourceMap": true,

        // 强类型检查配置
        "strict": true,
        "noImplicitAny": false,

        // 模块分析配置
        "baseUrl": ".",
        "outDir": "./lib",
        "esModuleInterop": true,
        "moduleResolution": "node",
        "resolveJsonModule": true
    },
    "include": ["src"]
}
```



### 配置 Rollup

---

> Vue、React 等许多流行库都在使用 Rollup 进行，这里就不在过多介绍，详细信息见 [官网](https://www.rollupjs.com/) 。

**安装依赖库**

```bash
# 安装 rollup 以及要用到的插件
yarn add --dev rollup rollup-plugin-babel rollup-plugin-commonjs rollup-plugin-eslint rollup-plugin-node-resolve rollup-plugin-typescript2 
# 安装 babel 相关的库
yarn add --dev @babel/core @babel/preset-env  

# 或者
npm install -d rollup rollup-plugin-babel rollup-plugin-commonjs rollup-plugin-eslint rollup-plugin-node-resolve rollup-plugin-typescript2 
npm install -d @babel/core @babel/preset-env 
```

**创建文件（夹）**

```bash
touch rollup.config.js && touch .babelrc
```

**目录概览**

```
typescript-helper  
 |- .babelrc
 |- rollup.config.ts
```

**编辑`.babelrc`文件**

```json
{
    "presets": [
        [
            "@babel/preset-env",
            {
                // Babel 会在 Rollup 有机会做处理之前，将我们的模块转成 CommonJS，导致 Rollup 的一些处理失败
                "modules": false
            }
        ]
    ]
}
```

**编辑 `rollup.config.js` 文件**

```typescript
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
```

**编辑 ` src/index.ts` 文件**

```typescript
export function add(a: number, b: number){
    return a + b;
}

export function minus(a: number, b: number){
    return a - b;
}
```

**验证测试**

```bash
npx rollup -c rollup.config.js
```

一切顺利的话会生成了 `index.js` 和 `index.esm.js` 文件，分别对应着 commonjs 规范和 es 规范的文件。

> Rollup 可是大力推行 es 规范啊，然而很多三方库都仍旧使用 commonjs 规范，为了兼容就两种规范都生成。



### 配置 API Extractor

---

> 当 src 目录下有多个文件时，打包后会生成多个声明文件，使用 `@microsoft/api-extractor` 这个库可以把所有的 `*.d.ts` 文件合成一个，并且还可以根据写的注释自动生成文档。

**安装依赖库**

```shell
yarn add --dev @microsoft/api-extractor
# 或者
npm install -d @microsoft/api-extractor
```

**创建文件（夹）**

```bash
touch api-extractor.json
```

**目录概览**

```
typescript-helper  
 |- api-extractor.json
```

**编辑 `api-extractor.json` 文件**

```json
{
    "$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
    "mainEntryPointFilePath": "./lib/index.d.ts",
    "bundledPackages": [],

    "apiReport": {
        "enabled": true,
        "reportFolder": "<projectFolder>/temp/"
    },

    "docModel": {
        "enabled": true
    },
    
    "dtsRollup": {
        "enabled": true,
        "untrimmedFilePath": "./lib/index.d.ts"
    }
}
```

**编辑 `package.json` 文件**

```json
{
    // ...,
    "scripts":{
        // ...,
        "api": "api-extractor run",
        // ...
    },
    // ...
}
```

**编辑 `src/index.ts`**

> 加入[ts doc](https://github.com/microsoft/tsdoc) 风格注释

```typescript
/**
 * 加法运算
 * @param a - 加数
 * @param b - 被加数
 * @returns the result of a plus b
 * @example
 * ```ts
 * minus(1, 2) => 2
 * ```
 * 
 * @beta
 */
export function add(a: number, b: number) {
    return a + b;
}

/**
 * 减法运算
 * @param a - 减数
 * @param b - 被减数
 * @returns the result of a minus b
 * @example
 * ```ts
 * minus(3, 2) => 1
 * ```
 * 
 * @beta
 */
export function minus(a: number, b: number) {
    return a - b;
}
```

**验证测验**

```bash
npx rollup --c rollup.config.js # 可以尝试多写几个方法文件，然后打包后会发现有多个 `.d.ts ` 文件
yarn api
```

> 注意： 这里会生成一个 temp 文件夹，需配置一下`.gitignore` 不然它将被提交提交。
>
> ```bash
> echo "temp/" >> .gitignore
> ```



### 配置 Jest

---

**安装依赖库**

```shell
yarn add --dev @types/jest eslint-plugin-jest jest ts-jest 
# 或者
npm install -d @types/jest eslint-plugin-jest jest ts-jest 
```

**创建文件（夹）**

```bash
mkdir test && touch test/index.spec.ts && touch jest.config.js
```

**目录概览**

```
typescript-helper  
 |- test
     |- index.spec.ts
 |- jest.config.js
```

**编辑 `jest.config.js` 文件**

```javascript
module.exports = {  
    preset: 'ts-jest',
    testEnvironment: 'node',
}
```

**编辑 `test/index.spec.ts` 文件**

> 编写功能测试

```typescript
import assert from "assert";
import { add, minus } from "../src/index";

describe("validate:", () => {
    /**
     * add
     */
    describe("add", () => {
        test(" test for add() function ", () => {
            assert.strictEqual(add(1, 2), 3);
        });
    });
    /**
     * minus
     */
    describe("minus", () => {
        test(" test for minus() function ", () => {
            assert.strictEqual(minus(3, 2), 1);
        });
    });
});
```

**编辑 `package.json` 文件**

```json
{
    // ...,
    "script":{
        // ...,
        "test": "jest --coverage --verbose -u",
        // ...
    },
    // ...
}
```

> - `--coverage` 输出测试覆盖率
> - `--verbose` 层次显示测试套件中每个测试的结果，会看着更加直观啦

**验证测试**

```
yarn test  
```

>  注意： 这里会生成一个 coverage 文件夹，需配置一下`.gitignore` 不然它将被提交提交。
>
> ```bash
> echo "coverage/" >> .gitignore
> ```

顺利的话可以靠到测试成功的提示。



## 项目规范化

> 规范化其实是工程化中很重要的一个部分，项目初期规范制定的好坏会直接影响到后期的开发质量：
>
> * 目录结构的制定
> * 编码规范
> * 文档规范
> * 提交描述规范
> * 分支管理规范
> * 接口规范
> * 视觉图标规范
> * ...
>
> 这里主要针对 `编码规范`、`文档规范`、`提交描述规范`等方面进行工具配置。



### 配置 ESLint

---

> TypeScirpt 已经全面采用 ESLint 作为代码检查 [The future of TypeScript on ESLint](https://eslint.org/blog/2019/01/future-typescript-eslint)，并且提供了 TypeScript 文件的解析器 和配置选项 [@typescript-eslint/eslint-plugin](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin)

**安装依赖库**

```shell
yarn add --dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
# 或者
npm install -d eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**创建文件（夹）**

```bash
touch .eslintrc.js .eslintignore tsconfig.eslint.json
```

> `tsconfig.eslint.json`  将用于 `eslintrc.parserOptions.project` ，由于该配置要求 include 每个 `*.ts`、`*.js` 文件，而这里仅需要打包 `src` 目录下的代码，所以增加了该配置文件。
>
> 如果 `eslintrc.parserOptions.project` 配置为 `tsconfig.json` ，则 `src` 目录以外的 `*.ts`、`*.js`  文件都会报错：
>
> ```bash
> Parsing error: "parserOptions.project" has been set for @typescript-eslint/parser.  
> The file does not match your project config: config.ts.  
> The file must be included in at least one of the projects provided.eslint  
> ```
>
> 虽然可以配置 `eslintrc.parserOptions.createDefaultProgram` 但会造成巨大的性能损耗。
>
> [issus: Parsing error: "parserOptions.project"...](https://github.com/typescript-eslint/typescript-eslint/issues/967)

**目录概览**

```
typescript-helper
 |- .eslintignore
 |- .eslintrc.js
 |- tsconfig.eslint.json
```

**编辑 `tsconfig.eslint.json` 文件**

```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "resolveJsonModule": true
    },
    "include": ["**/*.ts", "**/*.js"]
}
```

 **编辑 `.eslintrc.js` 文件**

```json
const eslintrc = {
    parser: "@typescript-eslint/parser", // 使用 ts 解析器
    extends: [
        "eslint:recommended", // eslint 推荐规则
        "plugin:@typescript-eslint/recommended", // ts 推荐规则
        "plugin:jest/recommended", // jest 推荐规则
    ],
    plugins: ["@typescript-eslint", "jest"],
    env: {
        browser: true,
        node: true,
        es6: true,
    },
    parserOptions: {
        project: "./tsconfig.eslint.json",
        ecmaVersion: 2019,
        sourceType: "module",
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
        },
    },
    rules: {}, // 自定义
};

module.exports = eslintrc;
```

**添加script脚本**

```json
{
    // ...,
    "scripts": {
        // ...,
        "eslint": "eslint",
        // ...
    }
}
```



### 配置 EditorConfig

---

> “EditorConfig 帮助开发人员在不同的编辑器和IDE之间定义和维护一致的编码样式。
>
> EditorConfig项目由用于定义编码样式**的文件格式**和一组**文本编辑器插件组成**，这些**插件**使编辑器能够读取文件格式并遵循定义的样式。
>
> EditorConfig文件易于阅读，并且与版本控制系统配合使用。
>
> 对于VS Core，对应的插件名是[EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

**创建文件（夹）**

```bash
touch .editorconfig
```

**目录概览**

```
typescript-helper
 |- .editorconfig
```

**编辑`.editorconfig` 文件**

```bash
# EditorConfig is awesome: https://EditorConfig.org

# top-most EditorConfig file
root = true

# Unix-style newlines with a newline ending every file
[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
indent_style = space
indent_size = 4

[{*.json,*.md,*.yml,*.*rc}]
indent_style = space
indent_size = 2
```



### 配置 Prettier

---

> Prettier 是格式化代码工具，用来保持团队的项目风格统一。

**安装依赖库**

```bash
yarn add --dev prettier
# 或者
npm install -d prettier
```

**创建文件（夹）**

```bash
touch .prettierrc
```

**目录概览**

```
typescript-helper
 |- .prettierrc
```

**编辑`.prettierrc`文件**

```json
{
  "trailingComma": "all",
  "tabWidth": 4,
  "semi": false,
  "singleQuote": true,
  "endOfLine": "lf",
  "printWidth": 120,
  "overrides": [
    {
      "files": ["*.md", "*.json", "*.yml", "*.yaml"],
      "options": {
        "tabWidth": 2
      }
    }
  ]
}
```

**添加script脚本**

```json
{
    // ...,
    "scripts": {
        // ...,
        "format": "prettier --write \"src/**/*.ts\" \"src/**/*.js\"",
        // ...
    }
}
```



### 配置 Git Hooks

---

> 通过配置 Git Hooks 可以运行一些自定义操作，这里主要通过`commit-msg`钩子对 commit message 进行校验，以规范化提交信息。
>
> 主要用到以下库：
>
> - `husky` 用于实现各种 Git Hooks。
>
> 当然，还存在现场的工具库可用于规范化提交信息，这里为方便高度地自定义提交信息的规范而手写了一个简单 commit message 校验脚本。

**安装依赖库**

```bash
yarn add husky --dev
# 或者
npm install husky -d
```

**创建建 scripts 文件（夹）**

```bash
mkdir scripts && touch scripts/verify-commit-msg.js && touch .huskyrc
```

**目录概览**

```
typescript-helper
 |- scripts 
     |- verify-commit-msg.js 
 |- .huskyrc
```

**编辑 `scripts/verify-commit-msg.js`文件**

```js
#!/usr/bin/env node

/**
 * This is a commit-msg sample running in the Node environment,
 *    and will be invoked on the commit-msg git hook.
 * 
 * You can use it by renaming it to `commit-msg` (without path extension),
 *    and then copying the renamed file to your project's directory `.git/hooks/`.
 * 
 * Note: To ensure it can be run, you should grunt the renamed file (`commit-msg`) 
 *    with running command `chmod a+x .git/hooks/commit-msg` in your project's directory.
 */
const chalk = require('chalk')
const message = require('fs')
  .readFileSync(process.argv[2], 'utf-8')
  .trim()

const COMMIT_REG = /^(revert: )?(work|feat|fix|docs|style|refactor|perf|test|workflow|build|ci|chore|merge|release)(\(.+\))?: .{1,50}/

if (!COMMIT_REG.test(message)) {
  console.log()
  console.error(
      `  ${chalk.bgRed.white(' ERROR ')} ${chalk.red(`invalid commit message format.`)}\n\n` 
      + chalk.red(`  Proper commit message format is required for automated changelog generation. Examples:\n\n`) 
      + `    ${chalk.green(`ffeat(pencil): add 'graphiteWidth' option`)}\n` 
      + `    ${chalk.green(`fix(graphite): stop graphite breaking when width < 0.1 (close #28)`)}\n\n` 
      + chalk.red(`  See .github/commit-convention.md for more details.\n`)
  )
  process.exit(1)
}
```

> 上述脚本运行在 node 环境下，主要利用正则表达试对提交信息进行校验。
>
> 上述脚本内容直接拷贝到`.git/hooks/commit-msg`文件中也可成功运行（需要先创建`.git/hooks/commit-msg`文件并利用命令`chmod a+x .git/hooks/commit-msg`赋予可执行权限）。
>
> 更多 commit message 规范细节详见: [https://github.com/marktex/commit-convention](https://github.com/marktex/commit-convention)。

**编辑 `.huskyrc` 文件**

```json
{
    "hooks": {
        "commit-msg": "node scripts/verify-commit-msg.js ${HUSKY_GIT_PARAMS}"
    }
}
```

> 注：也可以直接将 `.huskyrc` 文件中的内容写到 `package.json` 文件中的 "husky" 属性下。

**验证测试**

```bash
git add .
git commit -m "test" # 提交信息不符合规范，正常情况下会报错
git commit -m "chore: use jest, eslint, prettier, editorconfig, husky, lint-staged, etc..."  # 提交信息符合规范，正常提交
```



## 项目自动化

> 通常项目中的发布流程是这样的：
>
> 1. 代码提交
> 2. 代码合并
> 3. 项目构建
> 4. 项目备份（线上代码备份）
> 5. 打包上传
> 6. 线上发布（合并至master分支）
> 7. ...
>
> 上面这一系列的过程，可能都是手动一步一步的打开文件、敲命令等纯劳力的重复性去做，而且还要保证每个步骤都是正确的才能进行下一步操作，一旦发生错误还没有可追溯可跟踪的相关日志和记录。
>
> > 在业界内有这么一句话：**任何简单机械的重复劳动都应该让机器去完成。**
>
> 现代前端技术不再是以前刀耕火种的年代了，所以前端工程化的很多脏活累活都应该交给自动化工具来完成，如现在社区和市场上有 Jenkins、Travis CI、Circle CI、Codeship 等很多知名持续集成和持续部署工具(CI/CD)，这些工具都可帮助自动完成构建、测试、部署代码的过程。
>
> 这里主要介绍构建工具 gulp、打包工具 rollup、测试工具 Jest+Codecov、持续集成工具 Travis CI 的配合使用，以实现一系列自动化操作。

### 配置 Git Hooks

---

> 之前通过配置 Git Hooks 中的 `commit-msg` 钩子对 commit message 进行了校验，以实现规范化提交信息。
>
> 这里还可以利用 Git Hooks 中的 `pre-commit` 钩子实现在每次提交时自动进行代码格式化、校验、测试等工作。
>
> 主要用到以下库：
>
> - `lint-staged` 用于对 Git 暂存区中的文件执行代码检测。

**安装依赖库**

```bash
yarn add lint-staged --dev
# 或者
npm install lint-staged -d
```

**编辑 `.huskyrc` 文件**

```json
{
    "hooks": {
        "pre-commit": "lint-staged  & jest -u",
        // ...
    }
}
```

> 注：也可以直接将 `.huskyrc` 文件中的内容写到 `package.json` 文件中的 "husky" 属性下。

**编辑 `package.json` 文件**

```json
{
    // ...,
    "lint-staged": {
        "**/*.js": [
            "prettier --write"
        ],
        "*.ts?(x)":[
            "prettier --write --parser=typescript",
            "eslint"
        ]
    },
    // ...
}
```

> 之后提交代码都会先格式化，再 lint 验证，最后 jest 测试通过，才可以提交。



### 配置 Gulp

---

**安装依赖库**

```bash
yarn add --dev gulp @types/gulp fs-extra @types/fs-extra @types/node ts-node chalk
# 或者
npm install -d  gulp @types/gulp fs-extra @types/fs-extra @types/node ts-node chalk
```

**创建文件（夹）**

```bash
touch gulpfile.js
```

**目录概览**

```
typescript-helper
 |- gulpfile.js
```

**编辑 `gulpfile.js` 文件**

> 构建流程参考：
>
> 1. 清空 `lib/` 目录文件
> 2. 呼叫 Rollup 打包
> 3. 呼叫 API Extractor 生成统一的声明文件并删除多余的声明文件
> 4. 完成

```typescript
const { series } = require('gulp')
const path = require('path')
const fse = require('fs-extra')
const chalk = require('chalk')
const { rollup } = require('rollup')
const { Extractor, ExtractorConfig, ExtractorResult } = require('@microsoft/api-extractor')
const rollupConfig = require('./rollup.config')

const log = {
    progress: (text) => {
        console.log(chalk.green(text))
    },
    error: (text) => {
        console.log(chalk.red(text))
    },
}

const paths = [
    path.join(__dirname, '/'), // root
    path.join(__dirname, '/lib'), // lib
]

// 删除 lib 文件
const clearLibFile = async (callback) => {
    fse.removeSync(paths[1])
    log.progress('Deleted lib file')
    callback()
}

// Rollup 打包
const buildByRollup = async (callback) => {
    const inputOptions = {
        input: rollupConfig.input,
        external: rollupConfig.external,
        plugins: rollupConfig.plugins,
    }
    const outOptions = rollupConfig.output
    const bundle = await rollup(inputOptions)

    // 写入需要遍历输出配置
    if (Array.isArray(outOptions)) {
        outOptions.forEach(async (outOption) => {
            await bundle.write(outOption)
        })
        callback()
        log.progress('Rollup built successfully')
    }
}

// api-extractor 整理 .d.ts 文件
const apiExtractorGenerate = async (callback) => {
    const apiExtractorJsonPath = path.join(__dirname, './api-extractor.json')
    // 加载并解析 api-extractor.json 文件
    const extractorConfig = await ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath)
    // 判断是否存在 index.d.ts 文件，这里必须异步先访问一边，不然后面找不到会报错
    const isExist = await fse.pathExists(extractorConfig.mainEntryPointFilePath)

    if (!isExist) {
        log.error('API Extractor not find index.d.ts')
        return
    }

    // 调用 API
    const extractorResult = await Extractor.invoke(extractorConfig, {
        localBuild: true,
        // 在输出中显示信息
        showVerboseMessages: true,
    })

    if (extractorResult.succeeded) {
        // 删除多余的 .d.ts 文件
        const libFiles = await fse.readdir(paths[1])
        libFiles.forEach(async (file) => {
            if (file.endsWith('.d.ts') && !file.includes('index')) {
                await fse.remove(path.join(paths[1], file))
            }
        })
        log.progress('API Extractor completed successfully')
        callback()
    } else {
        log.error(
            `API Extractor completed with ${extractorResult.errorCount} errors` +
                ` and ${extractorResult.warningCount} warnings`,
        )
    }
}

const complete = (callback) => {
    log.progress('---- end ----')
    callback()
}

/***
 * 构建过程
 * 1. 清空 `lib/` 目录文件
 * 2. 呼叫 Rollup 打包
 * 3. 呼叫 API Extractor 生成统一的声明文件并删除多余的声明文件
 * 4. 完成（顺序执行）
 */
module.exports.build = series(clearLibFile, buildByRollup, apiExtractorGenerate, complete);
```

**编辑 `package.json` 文件**

```json
{
    // ...,
    "main": "lib/index.js",
    "module": "lib/index.esm.js",
    "types": "lib/index.d.js",
	// ...,
    "scripts": {
        // ...,
        "build": "gulp build",
        // ...
    },
    // ...
}
```

**验证测试**

```shell
yarn build  
```

正常情况 `lib/` 文件夹下已经存在构建成功的文件。



### 配置 Conventional Changelog

**安装依赖库**

```shell
yarn add --dev conventional-changelog-cli  
# 或者
npm install -d  conventional-changelog-cli  
```

**编辑 `package.json` 文件**

```json
{
	// ...,
    "scripts": {
        // ...,
        "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s",
        // ...
    },
    // ...
}
```

> 使用 conventional-changelog 需要注意：
>
> - 非常注意 commit 格式。这里格式采用 [angular commit 规范](https://github.com/angular/angular/blob/master/CONTRIBUTING.md)，会识别 feat 和 fix 开头的 commit 然后自动生成 Change Log 到 `CHANGELOG.md` 文件。
> - 每次更改需要先升级 version 再去生成。

**编辑 `.huskyrc` 文件**

> 此步可选。这里是利用 Git Hooks 中的 `post-commit` 钩子在**提交之后**自动生成 Change Log。

```json
{
    "hooks": {
        "post-commit": "yarn run changelog",
        // ...
    }
}
```

> 注：也可以直接将 `.huskyrc` 文件中的内容写到 `package.json` 文件中的 "husky" 属性下。



### 配置 Travis CI

---

> Travis CI 提供的是持续集成服务，它仅支持 Github，不支持其他代码托管。
>
> 它需要绑定 Github 上面的项目，还需要该项目含有构建或者测试脚本。只要有新的代码，就会自动抓取，然后提供一个虚拟机环境，并执行测试，完成构建，还能部署到服务器。只要代码有变更，就自动运行构建和测试，反馈运行结果，以确保符合预期以后，再将新代码集成到主干。
>
> 这个项目需要Travis在提交后自动进行测试并且向 codecov 提供测试报告。

**登录 Travis CI 网站**

访问https://www.travis-ci.org/网站，使用github账号登录系统。

**创建文件（夹）**

```bash
touch .travis.yml
```

**目录概览**

```
typescript-helper
 |- .travis.yml
```

**编辑 `.travis.yml` 文件**

```yaml
language: node_js   # 项目语言
node_js:
  - 12.0.0          # 项目环境
cache:              # 缓存 node_js 依赖，提升第二次构建的效率
directories:
  - node_modules
install:            # Travis Ci 默认安装指令为 `yarn --frozen-lockfile`
  - yarn            # 该指令会锁定当前依赖包的版本号，当依赖包更新版本时 yarn 为了防止开发者沿用旧版本的依赖就会报出警告
test:
  - npm run test    # 运行自动测试框架
```

> 参考教程：[Travis CI Tutorial](https://docs.travis-ci.com/user/tutorial/)

**启动持续集成**

这里需要先上传`.travis.yml`配置文件到 Github 仓库，然后再在 Travis CI 网站上启动持续集成，之后再提交上传本地本地代码到 Github 仓库就会自动完成集成任务。

**获取持续集成通过徽标**

将下面 URL 中的 `<Github Username>`和`<Repository Name>` 替换为自己项目的即可，最后可以将集成完成后的 markdown 代码贴在自己的项目上。

```
[![Build Status](https://www.travis-ci.org/<Github Username>/<Repository Name>.svg?branch=master)](https://www.travis-ci.org/<Github Username>/<Repository Name>)
```

![Build Status](https://www.travis-ci.org/cjiali/typescript-helper.svg?branch=master)



### 配置 Codecov

---

> Codecov 是一个开源的测试结果展示平台，将测试结果可视化。
>
> Github上许多开源项目都使用了Codecov来展示单测结果。
>
> Codecov跟Travis CI一样都支持Github账号登录（网址：https://codecov.io/），同样会同步Github中的项目。

**安装依赖库**

```bash
yarn add codecov --dev
# 或者
npm install codecov -d
```

**编辑` package.json` 文件**

```json
{
    // ...,
    "scripts": {
        // ...,
        "codecov": "codecov",
        // ...,
    }
}
```

**编辑 `.travis.yaml` 文件**

```yaml
after_success:			# 构建成功后的自定义操作
  - npm run codecov	# 生成 Github 首页的 codecov 图标
```

![](https://cdn.jsdelivr.net/gh/cjiali/Pictures@master/20200927202316.jpeg)

最后获取测试通过图标，并嵌入到 `README.md` 之中。

```markdown
[![Codecov Coverage](https://img.shields.io/codecov/c/github/<Github Username>/<Repository Name>/<Branch Name>.svg?style=flat-square)](https://codecov.io/gh/<Github Username>/<Repository Name>/)
```

![Codecov Coverage](https://img.shields.io/codecov/c/github/cjiali/typescript-helper/master.svg?style=flat-square)



## 项目发布

**编辑` package.json` 文件**

```json
{
    // ...,
    "files": [
        "lib",
        "LICENSE",
        "CHANGELOG.md",
        "README.md"
    ],
    // 使得支持 tree shaking
    "sideEffects": "false",
    "script": {
        // ...,
        "changelog": "gulp changelog",
        "prepublish": "yarn lint & yarn test & yarn changelog & yarn build"
    },
    // ...
}
```

> prepublish 可以在 publish 的时候，先 lint 验证， 再 jest 测试 ， 再生成 changlog ，然后构建打包，最后发布。



## 参考链接

---

- [TypeScript 入门教程](https://ts.xcatliu.com/)

- [TypeSearch](https://microsoft.github.io/TypeSearch/)

- [The future of TypeScript on ESLint](https://eslint.org/blog/2019/01/future-typescript-eslint)

- [Rollup.js 中文网](https://www.rollupjs.com/)

- [rollup - pkg.module](https://github.com/rollup/rollup/wiki/pkg.module)

> If you're writing a package, strongly consider using `pkg.module`

- [jest 中文文档](https://jestjs.io/docs/zh-Hans/getting-started)

- [api-extractor](https://api-extractor.com/)

- [tsdoc](https://github.com/microsoft/tsdoc)

- [gulp](https://www.gulpjs.com.cn/docs/getting-started/quick-start/)
