import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, TrendingUp, Users } from 'lucide-react';
import { Button } from '../components/ui/button';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">

  <div className="overflow-hidden h-10 w-10 md:h-12 md:w-12 flex items-center justify-center">
    <img
      src="/logo.png"
      alt="MIC Trades"
      style={{
        transform: "scale(1.8)",
        objectFit: "contain"
      }}
      className="w-full h-full"
    />
  </div>

  <span className="text-base md:text-lg font-semibold tracking-tight text-gray-900">
    MIC Trades
  </span>

</div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-slate-600 hover:text-blue-600 transition">Features</a>
            <a href="#rates" className="text-slate-600 hover:text-blue-600 transition">Rates</a>
            <a href="#about" className="text-slate-600 hover:text-blue-600 transition">About</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/signin">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="inline w-4 h-4 mr-2" />
              Trusted P2P Crypto Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Trade Crypto with <span className="text-blue-600">Naira</span> Instantly
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Buy and sell Bitcoin, Ethereum, and USDT with Nigerian Naira. Fast, secure, and reliable P2P cryptocurrency trading platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  Start Trading <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/signin">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center space-x-6 text-sm text-slate-600">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-blue-600" />
                Secure Transactions
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-blue-600" />
                Instant Settlement
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="text-white/80 text-sm mb-2">Current Rate</div>
                <div className="text-3xl font-bold text-white mb-4">₦45,000,000</div>
                <div className="text-white/60 text-sm">1 BTC</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Choose MIC Trades?</h2>
            <p className="text-xl text-slate-600">Fast, secure, and reliable crypto trading</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Secure Trading</h3>
              <p className="text-slate-600">Bank-level security with escrow protection for all transactions</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Instant Processing</h3>
              <p className="text-slate-600">Quick verification and instant fund release after confirmation</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Best Rates</h3>
              <p className="text-slate-600">Competitive rates for buying and selling cryptocurrency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">2M+</div>
              <div className="text-slate-400">Trades Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">₦75B+</div>
              <div className="text-slate-400">Trading Volume</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">50K+</div>
              <div className="text-slate-400">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">99.8%</div>
              <div className="text-slate-400">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to Start Trading?</h2>
          <p className="text-xl text-slate-600 mb-8">Join thousands of users trading crypto with Naira</p>
          <Link to="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Create Free Account <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-600">
          <p>© 2025 MIC Trades. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
