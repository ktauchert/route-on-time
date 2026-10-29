import { ImageResponse } from "next/og";

const icons: Record<string, { size: number; maskable: boolean }> = {
  "192.png": { size: 192, maskable: false },
  "512.png": { size: 512, maskable: false },
  "maskable-512.png": { size: 512, maskable: true },
  "apple-180.png": { size: 180, maskable: true },
};

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const icon = Object.hasOwn(icons, file) ? icons[file] : null;
  if (!icon) return new Response("Not found", { status: 404 });

  // Maskable icons keep the letters inside the central 80 % safe zone.
  const text = Math.round(icon.size * (icon.maskable ? 0.36 : 0.44));
  const radius = icon.maskable ? 0 : Math.round(icon.size * 0.22);

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2457c5",
          color: "#ffffff",
          fontSize: text,
          fontWeight: 700,
          letterSpacing: -text * 0.04,
          borderRadius: radius,
        }}
      >
        RO
      </div>
    ),
    { width: icon.size, height: icon.size },
  );

  const body = await image.arrayBuffer();
  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
