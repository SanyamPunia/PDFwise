import Dashboard from "@/components/Dashboard";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

const Page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  /**
   * We need to sync the user with our DB (eventual consistency -> user is added to our db via webhooks)
   * 1. Check if user exists
   *    a) if it doesn't (first time user), use `auth-callback` to sync the user with db & then redirect to dashboard
   *    b) if it does, redirect to dashboard (normal)
   */
  if (!user || !user.id) redirect("/auth-callback?origin=dashboard");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=dashboard");

  return <Dashboard />
};

export default Page;
