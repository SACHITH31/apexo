import { createServerFn } from "@tanstack/react-start";

export const getSeasonData = createServerFn({ method: "GET" }).handler(async () => {
  const { getSeasonDataCached } = await import("./f1.server");
  const { mockSeasonData } = await import("./f1-fallback");
  try {
    return await getSeasonDataCached();
  } catch (error) {
    console.error("[f1] live data unavailable, serving fallback", error);
    return mockSeasonData();
  }
});
