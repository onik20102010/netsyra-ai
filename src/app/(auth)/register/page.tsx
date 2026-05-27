import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthCard title="Create an account" subtitle="Start building with intelligent AI orchestration">
      <RegisterForm />
    </AuthCard>
  );
}