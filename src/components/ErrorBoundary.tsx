// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from "react";
import React from "react";

interface Props {
  children: ReactNode;
  fallback?: string;
  componentName?: string;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console only — never expose to user
    console.error(`[FIFAiq] ${this.props.componentName} error:`, error.message, info.componentStack?.slice(0, 200));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: "#0a0f0a",
            border: "0.5px solid #ff3b3b33",
            borderRadius: 12,
            padding: "20px 16px",
            textAlign: "center",
          }}
          role="alert"
          aria-label={`${this.props.componentName ?? "Section"} error`}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
          <div style={{ fontSize: 13, color: "#c8dcc8", marginBottom: 4 }}>
            {this.props.fallback ??
              `${this.props.componentName ?? "This section"} is temporarily unavailable`}
          </div>
          <div style={{ fontSize: 11, color: "#3a5a3a" }}>
            Live data will restore automatically on next refresh
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: 12,
              background: "none",
              border: "0.5px solid #1e3a1e",
              borderRadius: 6,
              color: "#4a8a4a",
              fontSize: 11,
              padding: "5px 12px",
              cursor: "pointer",
              minHeight: 44,
              minWidth: 60,
            }}
            aria-label="Retry loading this section"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
