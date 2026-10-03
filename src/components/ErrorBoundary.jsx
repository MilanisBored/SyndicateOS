import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Terminal render error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleResetAndRecover = () => {
    try {
      localStorage.removeItem('syndicate_cached_fund_state');
      localStorage.removeItem('syndicate_cached_funds_list');
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-app, #09090b)',
          color: 'var(--text-primary, #f4f4f5)',
          padding: '24px',
          fontFamily: 'var(--font-sans, sans-serif)'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: 'var(--bg-surface, #121215)',
            border: '1px solid var(--border-subtle, #27272a)',
            borderRadius: '8px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '4px',
              padding: '3px 10px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#ef4444',
              marginBottom: '16px'
            }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
              TERMINAL RENDER NOTICE
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              Interface Interrupted
            </h2>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary, #a1a1aa)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {this.state.error?.message || 'A state synchronization error interrupted the terminal render.'}
            </p>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={this.handleReload}
                style={{
                  background: 'var(--accent, #f4f4f5)',
                  color: 'var(--accent-invert, #09090b)',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Terminal
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={this.handleResetAndRecover}
                style={{
                  background: 'var(--bg-subtle, #18181b)',
                  color: 'var(--text-secondary, #a1a1aa)',
                  border: '1px solid var(--border-subtle, #27272a)',
                  padding: '7px 14px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Clear Cache & Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
