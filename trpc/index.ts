import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";

/**
 * either we can use query or mutation
 * query -> purely for getting/fetching data
 * mutation -> for PATCH, POST, DELETE, etc.
 */

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    // Guard Clause
    if (!user?.id || !user.email) throw new TRPCError({ code: "UNAUTHORIZED" });

    // check if user is in the database
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id, // check if `id` of db is same as `id -> user.id` of current session
      },
    });

    if (!dbUser) {
      // create user in db in accordance with fields specified in User prisma schema (stripe values are optional)
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });
    }

    return { success: true };
  }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { user, userId } = ctx;

    return await db.file.findMany({
      where: {
        userId,
      },
    });
  }),
  deleteFile: privateProcedure
    .input(z.object({ id: z.string() })) // `id` is accessible in `mutation` params. `ctx` comes from the middleware we defined in `trpc/trpc.ts`
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      await db.file.delete({
        where: {
          id: input.id,
        },
      });

      return file;
    }),
});

// Used in `_trpc/client.ts` for passing type in client generic
export type AppRouter = typeof appRouter;
