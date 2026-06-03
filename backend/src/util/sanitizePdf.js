import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import { writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';

async function sanitizePdfBuffer(inputBuffer) {
    const id = randomUUID();
    const inputPath  = path.join('/tmp', `${id}_input.pdf`);
    const outputPath = path.join('/tmp', `${id}_output.pdf`);

    try {
        await writeFile(inputPath, inputBuffer);

        await new Promise((resolve, reject) => {
            execFile('qpdf', [
                '--linearize',
                '--remove-unreferenced-resources=yes',
                inputPath,
                outputPath,
            ], (err) => {
                if (err) {
                    if (err.code === 3) return resolve();
                    return reject(err);
                }
                resolve();
            });
        });

        return await readFile(outputPath);
    } finally {
        await unlink(inputPath).catch(() => {});
        await unlink(outputPath).catch(() => {});
    }
}

export { sanitizePdfBuffer };