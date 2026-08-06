// js-tiktoken imports the npm package `base64-js`. Browsers cannot resolve bare
// module specifiers, and base64-js is CommonJS besides. This shim provides the one
// function js-tiktoken actually calls, using the platform's own base64 decoder.
//
// This is the only modification made to the vendored library. The corresponding
// change is a single import specifier in chunk-VL2OQCWN.js, line 1.

export function toByteArray(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default { toByteArray };
