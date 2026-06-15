import React from 'react';
import { resolveSplashLogoUrl, resolveTenantTagline } from '../utils/tenantProfile';

import { resolveDisplayMediaUrl } from "../utils/mediaUrl";

function LogoMark({ url, name, size = 48 }) {
  const src = resolveDisplayMediaUrl(url);
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          objectFit: 'contain',
          background: '#fff',
        }}
      />
    );
  }

  const initial = (name || 'P').charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        color: '#16A34A',
        fontSize: size * 0.35,
      }}
    >
      {initial}
    </div>
  );
}

function SplashLoginMock({ profile, compact = false }) {
  const name = profile?.nama_pesantren?.trim() || 'Pesantren';
  const logoUrl = resolveSplashLogoUrl(profile);
  const tagline = resolveTenantTagline(profile);

  return (
    <div
      style={{
        borderRadius: compact ? 20 : 16,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: '#F8FAFC',
        width: compact ? 200 : '100%',
        maxWidth: compact ? 200 : 360,
        margin: compact ? '0 auto' : undefined,
      }}
    >
      <div
        style={{
          background: '#16A34A',
          padding: compact ? '20px 12px 16px' : '28px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          textAlign: 'center',
        }}
      >
        <LogoMark url={logoUrl} name={name} size={compact ? 40 : 52} />
        <div
          style={{
            color: '#fff',
            fontWeight: 800,
            fontSize: compact ? 13 : 16,
            lineHeight: 1.25,
          }}
        >
          {name}
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.92)',
            fontSize: compact ? 10 : 12,
            lineHeight: 1.4,
          }}
        >
          {tagline}
        </div>
      </div>
      <div style={{ padding: compact ? 10 : 14 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 10,
            border: '1px solid var(--border)',
            padding: compact ? 10 : 14,
            marginTop: compact ? -18 : -22,
            boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
          }}
        >
          <div
            style={{
              fontSize: compact ? 11 : 13,
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 8,
              color: 'var(--text-primary)',
            }}
          >
            Masuk ke Akun Anda
          </div>
          <div
            style={{
              height: compact ? 22 : 28,
              borderRadius: 6,
              background: '#F1F5F9',
              marginBottom: 6,
            }}
          />
          <div
            style={{
              height: compact ? 22 : 28,
              borderRadius: 6,
              background: '#F1F5F9',
              marginBottom: 10,
            }}
          />
          <div
            style={{
              height: compact ? 28 : 34,
              borderRadius: 8,
              background: '#16A34A',
            }}
          />
          <div
            style={{
              marginTop: 8,
              textAlign: 'center',
              fontSize: 9,
              color: 'var(--text-muted)',
            }}
          >
            Powered by KlikSantri
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppBrandingPreview({ profile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--neutral)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Desktop — Splash / Login
        </div>
        <SplashLoginMock profile={profile} />
      </div>
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--neutral)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Mobile
        </div>
        <SplashLoginMock profile={profile} compact />
      </div>
    </div>
  );
}
