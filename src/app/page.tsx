import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
        <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-lg font-semibold text-transparent">
          Mindora
        </span>
        <nav className="flex items-center gap-3 text-sm font-medium sm:gap-4">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-white transition-colors hover:bg-indigo-500 sm:px-4"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
        <div className="hero-glow w-full rounded-3xl border border-zinc-200 px-4 py-12 sm:px-8 sm:py-16 dark:border-zinc-800">
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
              Your friendly AI study partner
            </h1>
            <p className="mt-4 max-w-xl text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
              Upload your lecture notes and course materials. Mindora reads through
              them and helps you learn with tutoring chats, quizzes, flashcards,
              and summaries — all grounded in your own course content.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Create your account
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-zinc-300 bg-white/70 px-6 py-3 text-sm font-medium text-zinc-700 backdrop-blur transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 grid w-full gap-4 text-left sm:mt-16 sm:grid-cols-3 sm:gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Upload materials</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Slides, PDFs, and notes become a searchable knowledge base for each course.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Auto-generated lessons</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Every upload becomes a full lesson — with worked examples for calculations.
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
