import { AppRouter } from "@/trpc";
import { createTRPCReact } from "@trpc/react-query";

// pass the type of route in the generic below to allow `tRPC` access the types on the client
export const trpc = createTRPCReact<AppRouter>({});
