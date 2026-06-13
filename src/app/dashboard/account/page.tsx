import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const name = user?.user_metadata?.name as string | undefined;
  const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString() : null;

  return (
    <div className="space-y-6">
      <div className="hero-glow rounded-3xl border border-zinc-200 p-8 dark:border-zinc-800">
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Account</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Your Mindora profile and session details.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {name && (
            <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">Name</dt>
              <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{name}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{user?.email}</dd>
          </div>
          {joined && (
            <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">Member since</dt>
              <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{joined}</dd>
            </div>
          )}
        </dl>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
