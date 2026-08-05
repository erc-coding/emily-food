import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        Household Food App
      </h1>
      <LoginForm />
    </main>
  );
}
