import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  sessions: z
    .array(z.object({ key: z.string(), label: z.string(), iso: z.string() }))
    .max(10),
});

export const getRaceWeather = createServerFn({ method: "GET" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const { fetchRaceWeather } = await import("./weather.server");
    return await fetchRaceWeather(data);
  });
