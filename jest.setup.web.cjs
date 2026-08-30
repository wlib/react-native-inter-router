const { TextDecoder, TextEncoder } = require('node:util')

if (!globalThis.TextEncoder) globalThis.TextEncoder = TextEncoder
if (!globalThis.TextDecoder) globalThis.TextDecoder = TextDecoder
if (typeof window !== 'undefined') window.scrollTo = () => {}
