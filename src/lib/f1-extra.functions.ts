import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const season = z.string().regex(/^\d{4}$/);

export const getSeasonStats = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ season }).parse(data))
  .handler(async ({ data }) => {
    const { getSeasonStatsCached } = await import("./f1-extra.server");
    return await getSeasonStatsCached(data.season);
  });

export const getRaceDetail = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({ season, round: z.number().int().min(1).max(30) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { getRaceDetailCached } = await import("./f1-extra.server");
    return await getRaceDetailCached(data.season, data.round);
  });
