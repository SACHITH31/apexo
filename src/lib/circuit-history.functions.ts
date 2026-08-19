import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  circuitId: z.string().min(2).max(40),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
});

export const getCircuitHistory = createServerFn({ method: "GET" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const { fetchCircuitHistory } = await import("./circuit-history.server");
    const history = await fetchCircuitHistory(data);
    // Plain-clone: the raw upstream-derived objects trip the RPC serializer.
    return JSON.parse(JSON.stringify(history)) as typeof history;
  });
