import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Route on Time",
    short_name: "Route on Time",
    start_url: "/",
    display: "standalone",
  };
}
