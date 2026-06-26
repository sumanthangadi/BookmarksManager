import React from 'react';
import Button from '../UI/Button';
import GlassCard from '../UI/GlassCard';

export default function PaywallScreen({ user, pricing }) {

  const handlePayment = () => {
    const domain = import.meta.env.DEV ? 'http://localhost:5173' : 'https://getfolio.tech';
    const payUrl = `${domain}/pay?email=${encodeURIComponent(user.email)}`;
    window.open(payUrl, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <GlassCard className="max-w-md w-full p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow)' }}>
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Folio</h1>
        
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Your 30-day free trial has ended</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          Keep Folio forever for just ₹{pricing.price} — one time, no subscription.
        </p>
        
        {pricing.isLaunchPrice && (
          <div className="inline-block bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-6">
            🚀 Launch Offer · First 100 Users
          </div>
        )}
        
        <div className="mb-6 text-left p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Account</div>
          <div className="text-md" style={{ color: 'var(--text-primary)' }}>{user.email}</div>
        </div>
        
        <Button 
          variant="primary" 
          className="w-full py-3 mb-4 text-lg font-medium flex items-center justify-center gap-2"
          onClick={handlePayment}
        >
          Get Folio — ₹{pricing.price}
        </Button>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          You'll be redirected to a secure payment page
        </p>
      </GlassCard>
    </div>
  );
}
