import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = { children: ReactNode };

type State = { error: Error | null };

export class WebRootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.box}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.msg}>{this.state.error.message}</Text>
            <Text style={styles.hint}>Open the browser console (F12) for the full stack.</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#1B3A2D',
  },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 12 },
  msg: {
    color: '#E57373',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  hint: { color: '#A0B4AA', fontSize: 14 },
});
