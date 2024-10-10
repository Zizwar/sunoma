import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const SignInScreen = () => {
  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri: 'https://accounts.suno.com/sign-in' }}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default SignInScreen;