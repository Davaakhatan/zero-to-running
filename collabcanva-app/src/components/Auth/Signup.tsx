import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { ThemeToggle } from "../../contexts/ThemeContext";

export default function Signup() {
  const { user, signup, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(""); 
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) nav("/");
  }, [user, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    
    if (password.length < 6) {
      setErr("Password must be at least 6 characters long.");
      return;
    }
    
    try { 
      setBusy(true); 
      await signup(email, password, displayName || undefined); 
      nav("/"); 
    }
    catch (e: any) { 
      setErr(e.message || "Failed to create account. Please try again.");
    } 
    finally { setBusy(false); }
  }

  async function handleGoogleLogin() {
    setErr(null);
    try {
      setBusy(true);
      await loginWithGoogle();
      nav("/");
    } catch (e: any) {
      setErr(e.message || "Failed to sign in with Google.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
      {/* Theme Toggle - Fixed in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="md" />
      </div>
      
      <div className="w-full max-w-md mx-auto">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">Join CollabCanvas today</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200/50">
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Display Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name (Optional)</label>
              <input 
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                placeholder="How should we call you?" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input 
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                placeholder="you@example.com" 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input 
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                placeholder="At least 6 characters" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
            </div>

            {/* Error Message */}
            {err && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-xl text-sm">
                {err}
              </div>
            )}

            {/* Sign Up Button */}
            <button 
              disabled={busy} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3 font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transform"
            >
              {busy ? "Creating account…" : "Create Account"}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={busy}
              className="w-full border-2 border-gray-200 rounded-xl py-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold transition-all hover:scale-[1.02] transform"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            {/* Sign In Link */}
            <p className="text-sm text-gray-600 text-center pt-4">
              Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
