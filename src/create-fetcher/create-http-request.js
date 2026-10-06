/**
 * @template {unknown} T
 * @param {string | URL} url string
 * @param {RequestOptions} [options]
 * @returns {Promise<T>}
 * */
export function createHttpRequest(url, options) {
  const xhr = new XMLHttpRequest()
  const {
    method = 'GET',
    responseType = 'json',
    headers = {},
    body,
    timeout = 3600, // In ms
    ...restOptions
  } = options ?? {}

  return new Promise((resolve, reject) => {
    // Open request
    xhr.open(method, url)

    // Setup response type
    xhr.responseType = responseType

    // Setup timeout
    xhr.timeout = timeout

    // Setup header
    if (header) {
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))
    }

    // Send
    xhr.send(body)
  })
}

/**
 * @typedef RequestOptions
 * @property {"GET" | "POST" | "PUT" | "DELETE"} [method]
 * @property {Record<string, string>} [headers]
 * @property {"text" | "arraybuffer" | "blob" | "document" | "json" } [responseType]
 * @property {number} [timeout]
 * @property {XMLHttpRequestBodyInit} [body]
 * */
