import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { LogIn, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    const result = await login(password);
    setLoading(false);
    if (result.ok) {
      onSuccess();
    } else {
      setError(result.error ?? "Invalid password");
      setPassword("");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink/5">
            <Lock className="h-6 w-6 text-ink-light" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-ink">Admin Login</h1>
          <p className="mt-2 text-sm text-ink-light">
            Enter your password to access the admin panel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-light mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/80 disabled:opacity-40 transition-colors"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
