import React, { Component, ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

interface ErrorDisplayProps {
  error: Error | null;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Authentication Error
      </Text>
      <Text style={styles.message}>
        {error?.message || "An unexpected error occurred"}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={styles.button}
      >
        <Text
          style={{ color: "white", textAlign: "center" }}
        >
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
};

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Auth Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 24,
    textAlign: "center",
    opacity: 0.7,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    backgroundColor: '#007AFF',
  },
});

export default AuthErrorBoundary;
