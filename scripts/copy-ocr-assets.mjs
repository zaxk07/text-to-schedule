// Copies the tesseract.js worker, WASM core builds and English language data into public/ocr
// so OCR runs fully offline and no third-party CDN is contacted at runtime.
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const nm = join(root, 'node_modules')
const out = join(root, 'public', 'ocr')
mkdirSync(out, { recursive: true })

const copy = (from, to) => {
  if (!existsSync(from)) throw new Error(`Missing ${from}. Run npm install first.`)
  cpSync(from, join(out, to))
}

copy(join(nm, 'tesseract.js', 'dist', 'worker.min.js'), 'worker.min.js')
// We only use the LSTM engine (oem 1), so the LSTM builds are enough; tesseract.js picks the best one for the browser.
const coreDir = join(nm, 'tesseract.js-core')
for (const f of readdirSync(coreDir)) {
  if (/^tesseract-core.*lstm\.wasm\.js$/.test(f)) copy(join(coreDir, f), f)
}
copy(join(nm, '@tesseract.js-data', 'eng', '4.0.0', 'eng.traineddata.gz'), 'eng.traineddata.gz')
console.log('OCR assets copied to public/ocr')
