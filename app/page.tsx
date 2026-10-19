import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const signInPath = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeGate />
    </Suspense>
  );
}

async function HomeGate() {
  const { isAuthenticated } = await auth();

  redirect(isAuthenticated ? "/editor" : signInPath);
  return null;
}
