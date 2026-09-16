import { PasswordResetScreen } from "@/modules/auth/components/password-reset-screen";

export default async function PasswordResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <main className="flex min-h-[100dvh] justify-center overflow-x-hidden bg-surface"><PasswordResetScreen token={token} /></main>;
}
