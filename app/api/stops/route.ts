import { NextResponse } from "next/server";
import { searchStops } from "@/app/routes/actions";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const places = await searchStops(query);
  return NextResponse.json(places);
}
