import { queries } from "@clinic-app/db/queries";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const listServices = protectedProcedure
  .input(
    z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(50),
    }),
  )
  .output(
    z.object({
      services: z.array(z.any()),
      total: z.number(),
      page: z.number(),
      totalPages: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { search, category, page, pageSize } = input;
    const clinicId = context.clinicId ?? "";

    return await queries.service.listServices({
      clinicId,
      search,
      category,
      page,
      pageSize,
    });
  });

export const getService = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.any())
  .handler(async ({ input, context }) => {
    const found = await queries.service.getServiceById(
      input.id,
      context.clinicId ?? undefined,
    );

    if (!found) {
      throw new Error("Service not found");
    }
    return found;
  });
