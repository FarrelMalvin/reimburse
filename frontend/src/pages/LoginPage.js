import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login berhasil!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden" data-testid="login-page">
      {/* Left - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80"
          alt="Office"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right bottom, rgba(15,23,42,0.92), rgba(51,65,85,0.85))" }}>
          <div className="flex flex-col justify-end h-full p-12 pb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>K</span>
                </div>
                <span className="text-white/90 font-semibold text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>KantorPlus</span>
              </div>
              <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Kelola Operasional<br />Kantor Lebih Efisien
              </h1>
              <p className="text-slate-300 text-base max-w-md leading-relaxed">
                Sistem manajemen bon, pengaduan, cuti, dan inventaris dalam satu platform terintegrasi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>K</span>
            </div>
            <span className="text-slate-900 font-semibold text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>KantorPlus</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Masuk ke Akun
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              Masukkan email dan password untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@kantor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-lg border-slate-200 focus:ring-slate-900"
                  required
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 rounded-lg border-slate-200 focus:ring-slate-900"
                  required
                  data-testid="login-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-all active:scale-[0.98]"
              data-testid="login-submit-button"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Masuk <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Akun Demo</p>
            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="font-medium text-slate-700">Pegawai:</span> pegawai@kantor.com</p>
              <p><span className="font-medium text-slate-700">Atasan:</span> atasan@kantor.com</p>
              <p><span className="font-medium text-slate-700">HRGA:</span> hrga@kantor.com</p>
              <p><span className="font-medium text-slate-700">Direktur:</span> direktur@kantor.com</p>
              <p><span className="font-medium text-slate-700">Finance:</span> finance@kantor.com</p>
              <p className="text-xs text-slate-400 mt-1">Password: password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
