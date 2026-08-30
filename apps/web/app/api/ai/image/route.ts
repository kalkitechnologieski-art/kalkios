import { NextRequest } from "next/server";
import { AgnesClient } from "@/lib/providers/agnes/client";
import { z } from "zod";

const ImageRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  size: z.enum(["1K", "2K", "3K", "4K"]).default("2K"),
  ratio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"]).default("16:9"),
  image: z.string().url().optional(),
  negative_prompt: z.string().optional(),
  steps: z.number().int().min(1).max(100).optional(),
  n: z.number().int().min(1).max(4).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ImageRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parsed.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { prompt, size, ratio, image, negative_prompt, steps, n } = parsed.data;

    const client = new AgnesClient();
    const requestBody: any = {
      model: "agnes-image-2.1-flash",
      prompt,
      size,
      ratio,
      n,
    };

    if (image) {
      requestBody.extra_body = {
        image: [image],
        response_format: "url",
      };
      if (negative_prompt) requestBody.extra_body.negative_prompt = negative_prompt;
      if (steps) requestBody.extra_body.steps = steps;
    } else {
      requestBody.extra_body = { response_format: "url" };
      if (negative_prompt) requestBody.extra_body.negative_prompt = negative_prompt;
      if (steps) requestBody.extra_body.steps = steps;
    }

    const result = await client.image(requestBody);

    return new Response(JSON.stringify({ data: result.data, created: result.created }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[ADMIN] Image generation error:", error);
    return new Response(
      JSON.stringify({ error: "Image generation failed", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
