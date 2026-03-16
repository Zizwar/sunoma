import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Button, Avatar, Text, useTheme } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const touchUrl = await AsyncStorage.getItem('@touchUrl');
      if (touchUrl) {
        const response = await fetch(touchUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': 'https://suno.com',
            'Referer': 'https://suno.com/',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
          }
        });
        if (response.ok) {
          const data = await response.json();
          const user = data.response?.user;
          if (user) {
            setUserInfo({
              name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
              handle: user.handle,
              avatar: user.profile_image_url,
            });
          }
        }
      } else {
        // fallback to cached values
        const name = await AsyncStorage.getItem('profileName');
        const avatar = await AsyncStorage.getItem('profileImage');
        if (name || avatar) setUserInfo({ name, avatar });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.avatarContainer}>
        <Avatar
          rounded
          size="large"
          source={userInfo?.avatar ? { uri: userInfo.avatar } : undefined}
          icon={{ name: 'person', type: 'material' }}
        />
      </View>
      {userInfo ? (
        <>
          {userInfo.name ? (
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {userInfo.name}
            </Text>
          ) : null}
          {userInfo.handle ? (
            <Text style={[styles.handle, { color: theme.colors.grey2 }]}>
              @{userInfo.handle}
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={[styles.infoText, { color: theme.colors.grey2, textAlign: 'center' }]}>
          Login via Central screen first
        </Text>
      )}
      <Button
        title="Settings"
        onPress={() => navigation.navigate('Settings')}
        containerStyle={styles.button}
        buttonStyle={{ backgroundColor: theme.colors.primary }}
      />
      <Button
        title="Refresh"
        onPress={loadProfile}
        containerStyle={styles.button}
        type="outline"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarContainer: { alignItems: 'center', marginVertical: 20 },
  infoText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  handle: { fontSize: 15, textAlign: 'center', marginBottom: 10 },
  button: { marginVertical: 8 },
});

export default ProfileScreen;
