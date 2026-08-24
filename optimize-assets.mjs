import sharp from "sharp";
import fs from "node:fs";

const jobs = [
  { p: "public/uploads/87bad1d2-928b-450e-9b48-c5ea37fc9c19.jpg", max: 2048, format: "jpeg" },
  { p: "public/uploads/b26352a0-df78-4a72-a339-0f697823c50b.jpg", max: 2048, format: "jpeg" },
];

for (const job of jobs) {
  try {
    const before = fs.statSync(job.p).size;
    const out = await sharp(job.p)
      .rotate()
      .resize({ width: job.max, height: job.max, fit: "inside", withoutEnlargement: true })
      .toFormat(job.format, { quality: 82 })
      .toBuffer();
    fs.writeFileSync(job.p, out);
    console.log(`${job.p.split("/").pop()}: ${(before / 1024 / 1024).toFixed(2)}MB -> ${(out.length / 1024 / 1024).toFixed(2)}MB`);
  } catch (e) {
    console.log(`${job.p.split("/").pop()} FAILED: ${e.code ?? e.message}`);
  }
}
