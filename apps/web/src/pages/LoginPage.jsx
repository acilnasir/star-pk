import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const LOGO_URL =
  'https://horizons-cdn.hostinger.com/07e427fa-d575-42a9-9e54-1062f7b90da9/16154b93057f5dee94b031eafddd81f4.png';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROLE_LIST } from '@/lib/units';

export default function LoginPage() {
  const { isAuthed, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch {
      setError('Email atau kata sandi salah. Silakan periksa kembali.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-[100dvh] bg-sidebar-background"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 60% at 20% 40%, hsl(222 70% 38% / 0.55), transparent), radial-gradient(circle at 85% 20%, hsl(211 90% 50% / 0.2), transparent), linear-gradient(160deg, hsl(222 72% 18%) 0%, hsl(222 72% 28%) 45%, hsl(222 65% 22%) 100%)',
      }}
    >
      <Helmet>
        <title>Masuk — STAR-PK</title>
        <meta
          name="description"
          content="Masuk ke STAR-PK, Simplifikasi Integrasi dan Akselerasi Layanan Pembimbingan Kemasyarakatan."
        />
      </Helmet>

      {/* Panel merek */}
      <div className="hidden flex-1 flex-col justify-between p-10 lg:flex">
        <div className="flex items-center">
          <img
            src={LOGO_URL}
            alt="STAR-PK — Simplifikasi, Integrasi, dan Akselerasi Layanan Pembimbingan Kemasyarakatan"
            className="h-16 w-auto max-w-md object-contain object-left"
          />
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
            Pantau kinerja Pembimbingan Kemasyarakatan dari pusat hingga unit kerja.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Satu dasbor berjenjang untuk seluruh Indonesia, provinsi, hingga
            kota/kabupaten — tugas, progres, dan tenggat terpantau langsung.
          </p>
          <div className="mt-8 space-y-2.5">
            {ROLE_LIST.map((role) => (
              <div
                key={role.id}
                className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${role.dot}`} />
                <p className="text-sm font-semibold text-white">
                  {role.label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/45">
          © {new Date().getFullYear()} STAR-PK — Kementerian Imigrasi dan Pemasyarakatan.
        </p>
      </div>

      {/* Panel formulir */}
      <div className="flex w-full items-center justify-center bg-background px-4 py-10 lg:w-[480px] lg:shrink-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center lg:hidden">
            <img
              src={LOGO_URL}
              alt="STAR-PK"
              className="h-12 w-auto max-w-[240px] object-contain object-left"
            />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">Masuk</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan akun yang telah terdaftar untuk melanjutkan.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@starpk.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata sandi</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full text-sm font-semibold bg-[hsl(211_90%_52%)] text-white hover:bg-[hsl(211_90%_46%)]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Belum punya akun?{' '}
            <Link to="/daftar" className="font-semibold text-primary hover:underline">
              Buat profil baru
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
