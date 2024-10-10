// CentralScreen.js
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme, Icon, Button } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const SUNO_DOMAIN = 'https://suno.com';
const SUNO_SIGNIN_URL = 'https://accounts.suno.com/sign-in?redirect_url=https%3A%2F%2Fsuno.com%2Fsinig';

const CentralScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const webViewRef = useRef(null);
  const [currentUrl, setCurrentUrl] = useState(SUNO_SIGNIN_URL);
  const [bearerToken, setBearerToken] = useState('');
  const [isWebViewMinimized, setIsWebViewMinimized] = useState(false);

  useEffect(() => {
    loadBearerToken();
  }, []);

  const loadBearerToken = async () => {
    try {
      const token = await AsyncStorage.getItem('@bearer');
      if (token) {
        setBearerToken(token);
      }
    } catch (error) {
      console.error('Error loading bearer token:', error);
    }
  };

  const saveBearerToken = async (token) => {
    try {
      await AsyncStorage.setItem('@bearer', token);
      setBearerToken(token);
    } catch (error) {
      console.error('Error saving bearer token:', error);
    }
  };

  const injectedJavaScript = `
    (function() {
      var originalFetch = window.fetch;
      window.fetch = function(url, options) {
        var start = new Date().getTime();
        var requestHeaders = options ? options.headers : {};
        var requestBody = options ? options.body : null;
        var cookiesInHeader = requestHeaders['Cookie'] || '';
        return originalFetch.apply(this, arguments).then(function(response) {
          var end = new Date().getTime();
          var duration = end - start;
          var responseHeaders = {};
          for (var pair of response.headers.entries()) {
            responseHeaders[pair[0]] = pair[1];
          }
          response.clone().text().then(function(responseBody) {
            var cookies = document.cookie;
            var localStorage = JSON.stringify(window.localStorage);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'networkLog',
              url: url,
              method: options ? options.method : 'GET',
              status: response.status,
              duration: duration,
              requestHeaders: requestHeaders,
              requestBody: requestBody,
              responseHeaders: responseHeaders,
              responseBody: responseBody,
              cookies: cookies,
              cookiesInHeader: cookiesInHeader,
              localStorage: localStorage
            }));
          });
          if (url.includes('/api/discover/')) {
            var authHeader = requestHeaders['Authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
              var token = authHeader.slice(7);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'bearerToken',
                token: token
              }));
            }
          }
          return response;
        });
      };
    })();
    true;
  `;

  const handleMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'bearerToken') {
      saveBearerToken(data.token);
    } else if (data.type === 'networkLog') {
      navigation.navigate('NetworkLogs', { log: data });
    }
  };

  const onNavigationStateChange = (navState) => {
    setCurrentUrl(navState.url);
    if (navState.url.startsWith(SUNO_DOMAIN) && !navState.url.includes('accounts.')) {
      setIsWebViewMinimized(true);
    }
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
        ref={webViewRef}
        source={{ uri: SUNO_SIGNIN_URL }}
        style={[
          styles.webview, 
          isWebViewMinimized && { height: 1, opacity: 0 }
        ]}
        onNavigationStateChange={onNavigationStateChange}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
      />
      <View style={styles.tokenContainer}>
        <Text style={[styles.tokenTitle, { color: theme.colors.text }]}>Bearer Token:</Text>
        <Text style={[styles.tokenText, { color: theme.colors.text }]} numberOfLines={3} ellipsizeMode="tail">
          {bearerToken}
        </Text>
      </View>
      <Button
        title="View Network Logs"
        onPress={() => navigation.navigate('NetworkLogs')}
        buttonStyle={{ backgroundColor: theme.colors.primary }}
        containerStyle={styles.buttonContainer}
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
  },
  tokenContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  tokenTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 12,
  },
  buttonContainer: {
    margin: 10,
  },
});

export default CentralScreen;