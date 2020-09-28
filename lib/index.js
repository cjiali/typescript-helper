'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
function add(a, b) {
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

function minus(a, b) {
  return a - b;
}

exports.add = add;
exports.minus = minus;
