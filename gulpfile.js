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
module.exports.build = series(clearLibFile, buildByRollup, apiExtractorGenerate, complete)
