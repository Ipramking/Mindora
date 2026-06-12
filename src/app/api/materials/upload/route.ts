import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chunkPages, embedTexts, extractPages } from "@/lib/ingestion";

const ALLOWED_TYPES = new Set(["pdf", "docx", "txt", "md"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const courseId = formData.get("courseId");

  if (!(file instanceof File) || typeof courseId !== "string") {
    return NextResponse.json({ error: "Missing file or courseId" }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_TYPES.has(extension)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PDF, DOCX, TXT, or Markdown." },
      { status: 400 }
    );
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const storagePath = `${userData.user.id}/${courseId}/${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("materials")
    .upload(storagePath, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: material, error: insertError } = await supabase
    .from("materials")
    .insert({
      course_id: courseId,
      title: file.name,
      file_path: storagePath,
      file_type: extension,
      status: "processing",
    })
    .select("*")
    .single();

  if (insertError || !material) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create material" },
      { status: 500 }
    );
  }

  try {
    const pages = await extractPages(buffer, extension);
    const chunks = chunkPages(pages);

    if (chunks.length === 0) {
      throw new Error("No readable text found in this file.");
    }

    const embeddings = await embedTexts(chunks.map((c) => c.content));

    const { error: chunksError } = await supabase.from("chunks").insert(
      chunks.map((chunk, i) => ({
        material_id: material.id,
        content: chunk.content,
        embedding: embeddings[i],
        page_number: chunk.pageNumber,
        chunk_index: chunk.chunkIndex,
      }))
    );

    if (chunksError) throw new Error(chunksError.message);

    await supabase.from("materials").update({ status: "ready" }).eq("id", material.id);
  } catch (err) {
    await supabase
      .from("materials")
      .update({
        status: "error",
        error_message: err instanceof Error ? err.message : "Processing failed",
      })
      .eq("id", material.id);
  }

  return NextResponse.json({ id: material.id });
}
