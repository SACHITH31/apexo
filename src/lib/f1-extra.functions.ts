import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSeasonStats = createServerFn({ method: "GET" }).handler(async () => {
  const { getSeasonStatsCached } = await import("./f1-extra.server");
  return await getSeasonStatsCached();
});

export const getRaceDetail = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ round: z.number().int().min(1).max(30) }).parse(data))
  .handler(async ({ data }) => {
    const { getRaceDetailCached } = await import("./f1-extra.server");
    return await getRaceDetailCached(data.round);
  });
