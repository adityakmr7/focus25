import TypographyText from "@/components/TypographyText";
import React, { Component, ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

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
        <View style={styles.container}>
          <TypographyText variant="title" style={styles.title}>
            Authentication Error
          </TypographyText>
          <TypographyText variant="body" style={styles.message}>
            {this.state.error?.message || "An unexpected error occurred"}
          </TypographyText>
          <TouchableOpacity
            onPress={() => {
              this.setState({ hasError: false, error: null });
            }}
            style={styles.button}
          >
            <TypographyText
              variant="body"
              style={{ color: "white", textAlign: "center" }}
            >
              Try Again
            </TypographyText>
          </TouchableOpacity>
        </View>
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
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    marginBottom: 24,
    textAlign: "center",
    opacity: 0.7,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    marginTop: 16,
  },
});

export default AuthErrorBoundary;
