export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-purple-600">
              <svg
                className="h-3 w-3 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              CrowdFund — Powered by Stellar
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500 dark:text-zinc-500">
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-300"
            >
              Stellar
            </a>
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-300"
            >
              Freighter
            </a>
            <a
              href="https://developers.stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-300"
            >
              Docs
            </a>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
          Built on Stellar Soroban for the next generation of decentralized
          crowdfunding.
        </p>
      </div>
    </footer>
  );
}
