import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
        <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
          Mindora
        </span>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/login" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-500"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Your friendly AI study partner
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Upload your lecture notes and course materials. Mindora reads through
          them and helps you learn with tutoring chats, quizzes, flashcards,
          and summaries — all grounded in your own course content.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Create your account
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            I already have an account
          </Link>
        </div>

        <div className="mt-16 grid w-full gap-6 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Upload materials</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Slides, PDFs, and notes become a searchable knowledge base for each course.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Chat with a tutor</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Ask questions and get patient explanations grounded in your own materials.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Quiz & review</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Auto-generated quizzes and flashcards help you study what matters.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
