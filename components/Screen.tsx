import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
  } from 'react-native';
  import { ReactNode } from 'react';
  
  export default function Screen({
    children,
    scroll = false,
    style = {},
  }: {
    children: ReactNode;
    scroll?: boolean;
    style?: any;
  }) {
    const Container = scroll ? ScrollView : View;
  
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <Container
            style={[styles.flex, style]}
            contentContainerStyle={scroll ? styles.scroll : undefined}
          >
            {children}
          </Container>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: '#111',
    },
    flex: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      paddingTop: Platform.OS === 'android' ? 60 : 20,
      paddingBottom: 100,
      paddingHorizontal: 20,
      justifyContent: 'flex-start',
    },
  });
  