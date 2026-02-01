'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type AuthMode = 'login' | 'signup';

type Role = 'producer' | 'fan';

type FormState = {
  email: string;
  password: string;
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen w-full bg-neutral-950 text-neutral-50 flex items-center justify-center p-4">
          <section className="w-full max-w-md">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6 shadow-sm">
              <p className="text-sm text-neutral-200">読み込み中…</p>
            </div>
          </section>
        </main>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<Role | null>(null);
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const title = useMemo(() => (mode === 'login' ? 'ログイン' : '新規登録'), [mode]);
  const endpoint = useMemo(() => (mode === 'login' ? '/api/auth/login' : '/api/auth/signup'), [mode]);

  useEffect(() => {
    const modeParam = (searchParams.get('mode') || '').toLowerCase();
    if (modeParam === 'signup') {
      setMode('signup');
    } else if (modeParam === 'login') {
      setMode('login');
    }

    const roleParam = (searchParams.get('role') || '').toLowerCase();
    if (roleParam === 'producer' || roleParam === 'fan') {
      setRole(roleParam);
    } else {
      setRole(null);
    }
  }, [searchParams]);

  function destinationForRole(nextRole: Role) {
    return nextRole === 'producer' ? '/producer' : '/fan';
  }

  function onChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatusMessage(null);

    const email = form.email.trim();
    const password = form.password;
    if (!email || !password) {
      setStatusMessage('メールアドレスとパスワードを入力してください。');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          setStatusMessage('ログインに失敗しました（ダミー）。');
          return;
        }

        let nextRole: Role = 'fan';
        try {
          const data = (await res.json()) as { role?: unknown };
          if (data.role === 'producer' || data.role === 'fan') {
            nextRole = data.role;
          }
        } catch {
          // ignore
        }

        window.location.href = destinationForRole(nextRole);
        return;
      }

      // signup
      if (!role) {
        setStatusMessage('新規登録には role の指定が必要です。');
        return;
      }

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) {
        setStatusMessage('新規登録に失敗しました（ダミー）。');
        return;
      }

      window.location.href = destinationForRole(role);
    } catch {
      setStatusMessage('通信に失敗しました（ダミー）。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-neutral-950 text-neutral-50 flex items-center justify-center p-4">
      <section className="w-full max-w-md">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="inline-flex rounded-xl bg-neutral-950 border border-neutral-800 p-1" role="tablist" aria-label="ログイン切り替え">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={
                  "px-4 py-2 text-sm rounded-lg transition select-none " +
                  (mode === 'signup'
                    ? 'bg-neutral-200 text-neutral-950'
                    : 'text-neutral-200 hover:bg-neutral-900')
                }
                onClick={() => setMode('signup')}
              >
                新規登録
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={
                  "px-4 py-2 text-sm rounded-lg transition select-none " +
                  (mode === 'login'
                    ? 'bg-neutral-200 text-neutral-950'
                    : 'text-neutral-200 hover:bg-neutral-900')
                }
                onClick={() => setMode('login')}
              >
                ログイン
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-neutral-300">ユーザーネーム/メールアドレス/電話番号、どれでもOK…っぽい雰囲気（UIのみ）</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {mode === 'signup' && !role ? (
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 text-sm text-neutral-100 hover:bg-neutral-900"
                  onClick={() => {
                    window.location.href = '/login?mode=signup&role=producer';
                  }}
                >
                  プロデューサーとして登録
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 text-sm text-neutral-100 hover:bg-neutral-900"
                  onClick={() => {
                    window.location.href = '/login?mode=signup&role=fan';
                  }}
                >
                  ファンとして登録
                </button>
              </div>
            ) : null}

            <div>
              <label className="block text-sm text-neutral-200" htmlFor="email">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={form.email}
                onChange={onChange('email')}
                className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-200" htmlFor="password">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={form.password}
                onChange={onChange('password')}
                className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                placeholder="••••••••"
              />
            </div>

            {statusMessage ? (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200" role="status" aria-live="polite">
                {statusMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-neutral-200 text-neutral-950 py-3 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '送信中…' : title}
            </button>

            <div className="space-y-2">
              <button
                type="button"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 text-sm text-neutral-100 hover:bg-neutral-900"
                onClick={() => setStatusMessage('「パスワードを忘れた？」（ダミー）')}
              >
                パスワードを忘れた？
              </button>
              <button
                type="button"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 text-sm text-neutral-100 hover:bg-neutral-900"
                onClick={() => setStatusMessage('ワンタイムコードをメールで送信（ダミー）')}
              >
                ワンタイムコードをメールで送信
              </button>
              <button
                type="button"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 text-sm text-neutral-100 hover:bg-neutral-900"
                onClick={() => setStatusMessage('クイックサインイン（ダミー）')}
              >
                クイックサインイン
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-neutral-800 pt-5 text-sm text-neutral-300 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span>アカウントをお持ちでないですか？</span>
              <button type="button" className="text-neutral-50 underline" onClick={() => setMode('signup')}>
                新規登録
              </button>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>すでに登録済みですか？</span>
              <button type="button" className="text-neutral-50 underline" onClick={() => setMode('login')}>
                ログイン
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-500">※ 認証ロジックは未実装（UIのみ）</p>
      </section>
    </main>
  );
}
