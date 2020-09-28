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
const message = require('fs').readFileSync(process.argv[2], 'utf-8').trim()

const COMMIT_REG = /^(revert: )?(work|feat|fix|docs|style|refactor|perf|test|workflow|build|ci|chore|merge|release)(\(.+\))?: .{1,50}/

if (!COMMIT_REG.test(message)) {
    console.log()
    console.error(
        `  ${chalk.bgRed.white(' ERROR ')} ${chalk.red(`invalid commit message format.`)}\n\n` +
            chalk.red(`  Proper commit message format is required for automated changelog generation. Examples:\n\n`) +
            `    ${chalk.green(`ffeat(pencil): add 'graphiteWidth' option`)}\n` +
            `    ${chalk.green(`fix(graphite): stop graphite breaking when width < 0.1 (close #28)`)}\n\n` +
            chalk.red(`  See .github/commit-convention.md for more details.\n`),
    )
    process.exit(1)
}
