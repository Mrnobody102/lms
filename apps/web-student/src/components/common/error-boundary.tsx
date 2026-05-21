'use client';

import { defaultLocale, locales } from '@repo/shared';
import { useTranslations } from 'next-intl';
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryLabels {
  title: string;
  unexpected: string;
  tryAgain: string;
  goHome: string;
}

interface InnerProps extends Props {
  labels: ErrorBoundaryLabels;
}

interface State {
  hasError: boolean;
  error?: Error;
}

function getLocalizedHomePath() {
  if (typeof window === 'undefined') {
    return `/${defaultLocale}`;
  }

  const locale = window.location.pathname.split('/')[1];
  return (locales as readonly string[]).includes(locale) ? `/${locale}` : `/${defaultLocale}`;
}

class ErrorBoundaryInner extends Component<InnerProps, State> {
  constructor(props: InnerProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-6xl font-black text-destructive">!</h1>
              <h2 className="text-2xl font-bold text-foreground">{this.props.labels.title}</h2>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || this.props.labels.unexpected}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-opacity"
              >
                {this.props.labels.tryAgain}
              </button>
              <button
                onClick={() => window.location.assign(getLocalizedHomePath())}
                className="px-6 py-3 border border-border text-foreground font-bold rounded-2xl hover:bg-muted transition-colors"
              >
                {this.props.labels.goHome}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ErrorBoundary(props: Props) {
  const t = useTranslations('Student');

  return (
    <ErrorBoundaryInner
      {...props}
      labels={{
        title: t('errorBoundary.title'),
        unexpected: t('errorBoundary.unexpected'),
        tryAgain: t('errorBoundary.tryAgain'),
        goHome: t('errorBoundary.goHome'),
      }}
    />
  );
}
