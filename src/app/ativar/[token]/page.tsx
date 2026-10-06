import { ActivationScreen } from "@/modules/auth/components/activation-screen";

export default async function ActivationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <main className="flex min-h-[100dvh] justify-center bg-surface"><ActivationScreen token={token} /></main>;
}
