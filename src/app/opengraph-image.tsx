import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Safebreeder";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const interBold = await fetch(
    new URL("./fonts/Inter-Bold.woff", import.meta.url),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#4d7c2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize: 340,
          fontFamily: "Inter",
          fontWeight: 700,
          letterSpacing: -10,
        }}
      >
        S
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: interBold,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
