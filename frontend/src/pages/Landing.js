
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, TrendingUp, Users } from 'lucide-react';
import { Button } from '../components/ui/button';

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <img
              src="/logo.png"
              alt="MIC Trades logo"
              className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11 lg:h-12 lg:w-12"
            />
            <div className="min-w-0">
              <div className="truncate text-[1.65rem] font-black tracking-[-0.03em] text-slate-900 sm:text-[1.8rem] lg:text-[1.95rem]">
                MIC Trades
              </div>
              <div className="hidden text-xs font-medium tracking-[0.16em] text-slate-400 sm:block">
                P2P EXCHANGE
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
            <a href="#features" className="transition hover:text-blue-600">Features</a>
            <a href="#rates" className="transition hover:text-blue-600">Rates</a>
            <a href="#about" className="transition hover:text-blue-600">About</a>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/signin"
              className="text-sm font-semibold text-slate-700 transition hover:text-blue-600"
            >
              Sign In
            </Link>
            <Link to="/signup">
              <Button className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-700 sm:px-5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <Shield className="h-4 w-4" />
              Trusted P2P Crypto Platform
            </div>

            <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-[-0.04em] text-slate-900 sm:text-6xl lg:text-7xl">
              Trade Crypto with <span className="text-blue-600">Naira</span> Instantly
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Buy and sell Bitcoin, Ethereum, and USDT with Nigerian Naira. Fast,
              secure, and reliable P2P cryptocurrency trading platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup">
                <Button className="h-12 rounded-xl bg-blue-600 px-7 text-base font-semibold hover:bg-blue-700">
                  Start Trading
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/signin">
                <Button variant="outline" className="h-12 rounded-xl px-7 text-base font-semibold">
                  Sign In
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Secure Transactions
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                Instant Settlement
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-blue-600 p-8 shadow-[0_24px_60px_rgba(37,99,235,0.22)]">
            <div className="rounded-3xl border border-white/20 bg-white/10 p-8 text-white backdrop-blur">
              <p className="text-sm font-medium text-blue-100">Current Rate</p>
              <p className="mt-4 text-5xl font-black tracking-[-0.04em]">₦45,000,000</p>
              <p className="mt-4 text-blue-100">1 BTC</p>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-black tracking-[-0.03em] text-slate-900">
                Why Choose MIC Trades?
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Fast, secure, and reliable crypto trading
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: 'Secure Trading',
                  text: 'Bank-level security with escrow protection for all transactions',
                },
                {
                  icon: Zap,
                  title: 'Instant Processing',
                  text: 'Quick verification and instant fund release after confirmation',
                },
                {
                  icon: TrendingUp,
                  title: 'Best Rates',
                  text: 'Competitive rates for buying and selling cryptocurrency',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
                    <div className="mb-5 inline-flex rounded-2xl bg-blue-50 p-3 text-blue-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="rates" className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { value: '2M+', label: 'Trades Completed' },
                { value: '₦75B+', label: 'Trading Volume' },
                { value: '50K+', label: 'Active Users' },
                { value: '99.8%', label: 'Success Rate' },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <div className="text-4xl font-black tracking-[-0.03em] text-slate-900">{item.value}</div>
                  <div className="mt-3 text-sm font-medium text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h2 className="text-4xl font-black tracking-[-0.03em] text-slate-900">
              Ready to Start Trading?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Join thousands of users trading crypto with Naira
            </p>
            <div className="mt-8">
              <Link to="/signup">
                <Button className="h-12 rounded-xl bg-blue-600 px-8 text-base font-semibold hover:bg-blue-700">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          © 2025 MIC Trades. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
