import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface Props {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const IFRAME_ID = 'rork-web-preview';

const webTargetOrigins = [
  "http://localhost:3000",
  "https://rorkai.com",
  "https://rork.app",
];    

function sendErrorToIframeParent(error: any, errorInfo?: any) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    console.debug('Sending error to parent:', {
      error,
      errorInfo,
      referrer: document.referrer
    });

    const errorMessage = {
      type: 'ERROR',
      error: {
        message: error?.message || error?.toString() || 'Unknown error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
      },
      iframeId: IFRAME_ID,
    };

    try {
      window.parent.postMessage(
        errorMessage,
        webTargetOrigins.includes(document.referrer) ? document.referrer : '*'
      );
    } catch (postMessageError) {
      console.error('Failed to send error to parent:', postMessageError);
    }
  }
}

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const errorDetails = event.error ?? {
      message: event.message ?? 'Unknown error',
      filename: event.filename ?? 'Unknown file',
      lineno: event.lineno ?? 'Unknown line',
      colno: event.colno ?? 'Unknown column'
    };
    sendErrorToIframeParent(errorDetails);
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    sendErrorToIframeParent(event.reason);
  }, true);

  const originalConsoleError = console.error;
  console.error = (...args) => {
    sendErrorToIframeParent(args.join(' '));
    originalConsoleError.apply(console, args);
  };
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    sendErrorToIframeParent(error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (Platform.OS === 'web') {
        return (
          <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#f8fafc', backgroundColor: '#0f172a', minHeight: '100vh' }}>
            <h1 style={{ fontSize: 28, marginBottom: 12, color: '#ef4444' }}>Something went wrong</h1>
            <p style={{ fontSize: 16, color: '#94a3b8' }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
            {this.state.error?.stack && (
              <pre style={{ background: '#1e293b', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13, marginTop: 16 }}>
                {this.state.error.stack}
              </pre>
            )}
          </div>
        );
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>{this.state.error?.message}</Text>
            <Text style={styles.description}>
              Please check your device logs for more details.
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
}); 

export default ErrorBoundary;