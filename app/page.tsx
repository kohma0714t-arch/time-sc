'use client'

import { createClient } from '@/app/_lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('ログインに失敗しました。もう一度お試しください。')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Content */}
      <div className="w-full max-w-md mx-auto px-6 animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 mb-5">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            time-sc
          </h1>
          <p className="text-muted text-base">
            シフト管理をもっとシンプルに
          </p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-lg p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-center mb-6">
            ログイン
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-danger-bg text-danger text-sm text-center animate-fade-in">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-md
                       bg-surface border border-border
                       hover:bg-surface-hover hover:border-border-hover
                       active:scale-[0.99]
                       transition-all duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed
                       cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="font-medium text-sm">
              {loading ? 'ログイン中...' : 'Googleアカウントでログイン'}
            </span>
          </button>

          <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
            ログインすることで、シフト管理機能に<br />
            アクセスできるようになります
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-muted-foreground text-center">
          &copy; 2026 time-sc. All rights reserved.
        </p>
      </div>
    </div>
  )
}
