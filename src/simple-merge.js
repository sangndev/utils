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
        const targetValueType = typeof target[key]

        const isNotObjectAndDifferentValue =
          targetValueType !== 'object' &&
          optionsValueType !== 'object' &&
          target[key] !== options[key]

        const shouldReplace =
          !targetHasIt ||
          typeof target[key] !== optionsValueType ||
          isNotObjectAndDifferentValue

        if (shouldReplace) {
          target[key] = options[key]
        } else if (optionsValueType === 'object') {
          target[key] = merge(target[key], options[key])
        }
      }
    }
  }
  return target
}
