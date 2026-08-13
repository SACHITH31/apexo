import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const seasonInput = z.object({ season: z.string().regex(/^\d{4}$/) });

export const getSeasonData = createServerFn({ method: "GET" })
  .inputValidator((data) => seasonInput.parse(data))
  .handler(async ({ data }) => {
    const { getSeasonDataCached } = await import("./f1.server");
    const { mockSeasonData } = await import("./f1-fallback");
    try {
      return await getSeasonDataCached(data.season);
    } catch (error) {
      console.error("[f1] live data unavailable, serving fallback", error);
      return mockSeasonData();
    }
  });

export const getSeasons = createServerFn({ method: "GET" }).handler(async () => {
  const { getSeasonsCached } = await import("./f1.server");
  try {
    return await getSeasonsCached();
  } catch {
    return [] as string[];
  }
});
