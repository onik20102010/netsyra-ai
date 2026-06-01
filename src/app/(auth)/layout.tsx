import AuthBackground from "@/components/auth/AuthBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-black select-none">
      <AuthBackground />
      <div className="w-full max-w-md z-10">{children}</div>
    </div>
  );
}