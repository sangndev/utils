/**
 * @param {Object} target
 * @param {Object} options
 * */
export function merge(target, options) {
  if (!target) {
    target = {}
  }
  if (options) {
    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        const targetHasIt = target.hasOwnProperty(key)
        const optionsValueType = typeof options[key]
        const shouldReplace =
          !targetHasIt || typeof target[key] !== optionsValueType

        if (shouldReplace) {
          // Continue: https://github.com/anvaka/ngraph.merge/blob/master/index.js
        }
      }
    }
  }
  return target
}
