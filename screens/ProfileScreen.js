import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button, Input, Avatar, Text, Icon, useTheme } from 'react-native-elements';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [userInfo, setUserInfo] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '416959722533-6da188n1qdo2nd3al5a6d3u73jd6ilq2.apps.googleusercontent.com',
    // Add iOS clientId if you have one
  });

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      handleSignInWithGoogle(response.authentication.accessToken);
    }
  }, [response]);

  const loadUserInfo = async () => {
    try {
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const handleSignInWithGoogle = async (accessToken) => {
    try {
      const userResponse = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const userData = await userResponse.json();
      
      const authResponse = await fetch('https://suno.deno.dev/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          email: userData.email,
          sid: userData.id,
          name: userData.name
        })
      });
      
      const authData = await authResponse.json();
      
      if (authData.status === "ok") {
        await AsyncStorage.setItem('userInfo', JSON.stringify(authData.userInfo));
        await AsyncStorage.setItem('token', authData.token);
        setUserInfo(authData.userInfo);
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("Error during Google sign in:", error);
      Alert.alert("Sign In Failed", "An error occurred during sign in. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('token');
      setUserInfo(null);
      Alert.alert("Signed Out", "You have been successfully signed out.");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.avatarContainer}>
        <Avatar
          rounded
          size="large"
          source={{ uri: userInfo?.avatar || 'https://via.placeholder.com/150' }}
        />
      </View>
      {userInfo ? (
        <>
          <Text style={[styles.infoText, { color: theme.colors.text }]}>Name: {userInfo.name}</Text>
          <Text style={[styles.infoText, { color: theme.colors.text }]}>Email: {userInfo.email}</Text>
          <Button
            title="Settings"
            onPress={() => navigation.navigate('Settings')}
            containerStyle={styles.button}
            buttonStyle={{ backgroundColor: theme.colors.primary }}
          />
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            containerStyle={styles.button}
            buttonStyle={{ backgroundColor: theme.colors.error }}
          />
        </>
      ) : (
        <Button
          title="Sign in with Google"
          onPress={() => promptAsync()}
          icon={
            <Icon
              name="google"
              type="font-awesome"
              size={20}
              color="white"
              style={{ marginRight: 10 }}
            />
          }
          containerStyle={styles.googleButton}
          buttonStyle={{ backgroundColor: '#4285F4' }}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  infoText: {
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    marginVertical: 10,
  },
  googleButton: {
    marginVertical: 10,
  },
});

export default ProfileScreen;