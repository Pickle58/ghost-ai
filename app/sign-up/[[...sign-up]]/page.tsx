import { SignUp } from "@clerk/nextjs";

import { AuthScreen } from "@/components/auth/auth-screen";

export default function SignUpPage() {
  return (
    <AuthScreen>
      <SignUp forceRedirectUrl="/editor" fallbackRedirectUrl="/editor" />
    </AuthScreen>
  );
}
