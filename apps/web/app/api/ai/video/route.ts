import { NextRequest } from "next/server";
import { AgnesClient } from "@/lib/providers/agnes/client";
import { z } from "zod";

const VideoRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  mode: z.enum(["text", "keyframe", "reference"]).default("text"),
  seconds: z.string().regex(/^[4-9]|1[0-2]$/).default("5"),
  size: z.enum(["720P", "960P", "2K"]).default("720P"),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]).default("16:9"),
  seed: z.number().int().optional(),
  first_frame: z.string().url().optional(),
  last_frame: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  audios: z.array(z.string().url()).optional(),
  videos: z.array(
    z.object({
      url: z.string().url(),
      start_seconds: z.number().optional(),
      require_audio: z.boolean().optional(),
    })
  ).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VideoRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parsed.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { prompt, mode, seconds, size, aspect_ratio, seed, first_frame, last_frame, images, audios, videos } = parsed.data;

    const client = new AgnesClient();
    const requestBody: any = {
      model: size === "720P" ? "agnes-video-2.5-flash" : "agnes-video-2.5",
      prompt,
      mode,
      seconds,
      size,
      aspect_ratio,
      n: 1,
    };

    if (seed) requestBody.seed = seed;

    if (mode === "keyframe") {
      if (first_frame) requestBody.first_frame = first_frame;
      if (last_frame) requestBody.last_frame = last_frame;
    }

    if (mode === "reference") {
      if (images) requestBody.images = images;
      if (audios) requestBody.audios = audios;
      if (videos) requestBody.videos = videos;
    }

    const result = await client.video(requestBody);

    return new Response(
      JSON.stringify({
        taskId: result.id,
        videoId: result.video_id,
        status: result.status,
        progress: result.progress,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[ADMIN] Video generation error:", error);
    return new Response(
      JSON.stringify({ error: "Video generation failed", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const videoId = url.searchParams.get("videoId");
    const modelName = url.searchParams.get("modelName") || "agnes-video-2.5-flash";

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "videoId required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = new AgnesClient();
    const status = await client.videoStatus(videoId, modelName);

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[ADMIN] Video status error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get video status", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
