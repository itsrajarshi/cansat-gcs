import React from 'react';
import { Github, Linkedin, Radio, ExternalLink } from 'lucide-react';

const GITHUB_URL = 'https://github.com/itsrajarshi';
const LINKEDIN_URL = 'https://www.linkedin.com/in/itsrajarshi/';

const socialLinks = [
  {
    label: 'GitHub',
    handle: '@itsrajarshi',
    href: GITHUB_URL,
    icon: Github,
  },
  {
    label: 'LinkedIn',
    handle: '@itsrajarshi',
    href: LINKEDIN_URL,
    icon: Linkedin,
  },
] as const;

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="sticky bottom-0 z-40 shrink-0 border-t border-aerospace-secondary/20 bg-aerospace-darker/90 backdrop-blur-md supports-[backdrop-filter]:bg-aerospace-darker/75 overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0, 217, 255, 0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-5 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-aerospace-accent/30 bg-aerospace-panel shadow-glow">
              <Radio className="h-5 w-5 text-aerospace-accent" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-aerospace-accent uppercase">
                CanSat Ground Control Software
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-100">Rajarshi Ghosh</p>
              <p className="mt-1 text-sm text-gray-400 max-w-md">
                Real-time telemetry monitoring and mission operations dashboard for aerospace engineering.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {socialLinks.map(({ label, handle, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg border border-aerospace-secondary/25 bg-aerospace-panel/60 px-4 py-3 transition-all duration-200 hover:border-aerospace-accent/50 hover:bg-aerospace-panel hover:shadow-glow"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-aerospace-darker/80 text-aerospace-accent transition-colors group-hover:text-aerospace-accent-light">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-200 group-hover:text-white">
                    {label}
                    <ExternalLink className="h-3 w-3 opacity-0 -translate-y-px transition-opacity group-hover:opacity-60" aria-hidden />
                  </span>
                  <span className="block text-xs font-mono text-gray-500 group-hover:text-aerospace-accent/80">
                    {handle}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-aerospace-secondary/15 pt-4 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
          <p>
            © {year} <span className="text-gray-400">Rajarshi Ghosh</span>. All rights reserved.
          </p>
          <p className="font-mono text-[11px] text-gray-600">
            Built with React · TypeScript · Leaflet · Three.js
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
