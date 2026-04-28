import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './lib/i18n'
import './index.css'
import { router } from './router'

// ─── Apply saved theme before render ──────────────────────────────────────────
const saved = localStorage.getItem('barberdesk-ui')
if (saved) {
  const { state } = JSON.parse(saved) as { state?: { theme?: string } }
  if (state?.theme === 'dark' || (!state?.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  }
} else {
  // Default: dark
  document.documentElement.classList.add('dark')
}

// ─── TanStack Query client ─────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
})

// ─── Start MSW if enabled ─────────────────────────────────────────────────────
async function prepare() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser')
    return worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    })
  }
}

prepare().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </React.StrictMode>
  )
})
