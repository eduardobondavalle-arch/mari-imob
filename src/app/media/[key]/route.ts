import { readMedia } from "@/lib/mari/storage";
import { errorResponse, HttpError } from "@/lib/mari/http";
import { session } from "@/lib/mari/auth";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const key = (await params).key;
    let media;
    try {
      media = await readMedia(key);
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 404) throw error;
      const admin = await session("admin");
      if (!admin?.admin) throw error;
      media = await readMedia(key, true);
    }
    const body = media.data.buffer.slice(
      media.data.byteOffset,
      media.data.byteOffset + media.data.byteLength,
    ) as ArrayBuffer;
    return new Response(body, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": media.isPublic
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
