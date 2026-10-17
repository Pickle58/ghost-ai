import { AuthControls } from "@/components/auth/auth-controls";

export default function Home() {
  return (
    <div className="relative flex flex-1 items-center justify-center bg-base text-copy-primary">
      <div className="absolute top-3 right-3">
        <AuthControls />
      </div>
      Ghost AI
    </div>
  );
}
