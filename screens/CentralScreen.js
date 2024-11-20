import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme, Icon } from 'react-native-elements';

const SUNO_SIGNIN_URL = 'https://accounts.suno.com/sign-in?redirect_url=https%3A%2F%2Fsuno.com%2Fsinig';

const CentralScreen = () => {
  const { theme } = useTheme();
  const [currentUrl, setCurrentUrl] = useState(SUNO_SIGNIN_URL);
  const [isWebViewMinimized, setIsWebViewMinimized] = useState(false);

  const onNavigationStateChange = (navState) => {
    setCurrentUrl(navState.url);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.navbar, { backgroundColor: theme.colors.grey5 }]}>
        <Text style={[styles.urlText, { color: theme.colors.text }]} numberOfLines={1}>
          {currentUrl}
        </Text>
        <TouchableOpacity onPress={() => setIsWebViewMinimized(!isWebViewMinimized)}>
          <Icon 
            name={isWebViewMinimized ? "expand" : "compress"} 
            type="font-awesome-5" 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      <WebView
        source={{ uri: SUNO_SIGNIN_URL }}
        style={[styles.webview, isWebViewMinimized && { height: 1, opacity: 0 }]}
        onNavigationStateChange={onNavigationStateChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  urlText: {
    flex: 1,
    marginRight: 10,
    fontSize: 12,
  },
  webview: {
    flex: 1,
  }
});

export default CentralScreen;