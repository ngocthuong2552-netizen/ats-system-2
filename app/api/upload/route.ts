import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error("Unsupported file type. Only PDF and DOCX are accepted.");
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.toLowerCase().split(".").pop();
  if (ext !== "pdf" && ext !== "docx") {
    return NextResponse.json({ error: "Unsupported file type. Only PDF and DOCX are accepted." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const storedName = `${randomUUID()}.${ext}`;
  await writeFile(path.join(uploadsDir, storedName), buffer);

  let cvText = "";
  try {
    cvText = await extractText(buffer, file.name);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to extract text" }, { status: 422 });
  }

  return NextResponse.json({
    fileUrl: `/uploads/${storedName}`,
    fileName: file.name,
    cvText,
  });
}
