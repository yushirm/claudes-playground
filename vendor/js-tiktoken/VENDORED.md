# vendor/js-tiktoken

`js-tiktoken`, pinned at **1.0.21**, MIT licensed. Fetched from the npm registry with
`npm pack js-tiktoken@1.0.21`. `LICENSE` is the upstream file.

Four files are kept. `lite.js` and `chunk-VL2OQCWN.js` are the BPE implementation.
`ranks/cl100k_base.js` is the merge table for the `cl100k_base` encoding — the real one,
about 100,000 entries, base64-packed, 1.1 MB.

One modification, and only one: line 1 of `chunk-VL2OQCWN.js` imported the npm package
`base64-js`. Browsers do not resolve bare module specifiers, and `base64-js` is CommonJS,
so that import now points at `base64-shim.js`, six lines that call the platform's own
`atob`. Nothing else in the library was touched. Diff it against the published tarball
if you want to check.
