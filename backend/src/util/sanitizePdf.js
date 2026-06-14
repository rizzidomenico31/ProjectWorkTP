import { execFile } from 'child_process'
import { randomUUID } from 'crypto'
import { writeFile, readFile, unlink } from 'fs/promises'
import os from 'os'
import path from 'path'

const TMP = os.tmpdir()

// Token che indicano contenuto attivo o potenzialmente pericoloso all'interno di
// un PDF. La loro presenza fa rifiutare il file (fail-closed): è più sicuro
// scartare un documento sospetto che tentare di ripulirlo parzialmente.
const DANGEROUS_TOKENS = [
  '/JavaScript',
  '/JS',
  '/Launch',
  '/OpenAction',
  '/AA',
  '/EmbeddedFile',
  '/EmbeddedFiles',
  '/RichMedia',
  '/XFA',
  '/SubmitForm',
  '/ImportData',
  '/GoToR',
  '/GoToE',
]

function runQpdf(args) {
  return new Promise((resolve, reject) => {
    execFile('qpdf', args, (err) => {
      // exit code 3 = solo warning: il file è comunque utilizzabile.
      if (err && err.code !== 3) return reject(err)
      resolve()
    })
  })
}

// Restituisce un buffer PDF normalizzato/linearizzato.
// Lancia un errore se il PDF non è valido o contiene contenuto attivo.
async function sanitizePdfBuffer(inputBuffer) {
  const id = randomUUID()
  const inputPath = path.join(TMP, `${id}_input.pdf`)
  const qdfPath = path.join(TMP, `${id}_qdf.pdf`)
  const outputPath = path.join(TMP, `${id}_output.pdf`)

  try {
    await writeFile(inputPath, inputBuffer)

    // 1) Decomprime il PDF in formato QDF e disabilita gli object stream, così
    //    che i dizionari (e quindi eventuali token pericolosi) siano in chiaro.
    await runQpdf(['--qdf', '--object-streams=disable', inputPath, qdfPath])

    const decoded = await readFile(qdfPath, 'latin1')
    const found = DANGEROUS_TOKENS.find((t) => decoded.includes(t))
    if (found) {
      throw new Error(`PDF contiene contenuto attivo non consentito (${found})`)
    }

    // 2) Produce la versione normalizzata/linearizzata da inoltrare a valle.
    await runQpdf([
      '--linearize',
      '--remove-unreferenced-resources=yes',
      inputPath,
      outputPath,
    ])

    return await readFile(outputPath)
  } finally {
    await unlink(inputPath).catch(() => {})
    await unlink(qdfPath).catch(() => {})
    await unlink(outputPath).catch(() => {})
  }
}

export { sanitizePdfBuffer }
