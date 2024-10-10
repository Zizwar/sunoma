import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Text, Switch, Divider } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../utils/ThemeContext';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileComponent from '../components/ProfileComponent';

const DrawerContent = (props) => {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const storedImage = await AsyncStorage.getItem('profileImage');
      const storedName = await AsyncStorage.getItem('profileName');
      
      if (storedImage) {
        setProfileImage(storedImage);
      }
      if (storedName) {
        setProfileName(storedName);
      }
      
      if (!storedImage || !storedName) {
        // If data is not in storage, fetch it
        await fetchProfileData();
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const fetchProfileData = async () => {
  const jwt = await AsyncStorage.getItem('@bearer');
    try {
      const response = await fetch('https://suno.deno.dev/touch?jwt='+jwt||null, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any necessary headers, such as authentication tokens
        },
      });
      const data = await response.json();
      const userData = data.response.user;
      
      const image = userData.profile_image_url;
      const name = `${userData.first_name} ${userData.last_name}`;
      
      setProfileImage(image);
      setProfileName(name);
      
      await AsyncStorage.setItem('profileImage', image);
      await AsyncStorage.setItem('profileName', name);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('profileImage');
    await AsyncStorage.removeItem('profileName');
    setProfileImage(null);
    setProfileName('');
    props.navigation.navigate('Login');
  };

  const DrawerItemIcon = ({ name }) => (
    <Ionicons name={name} size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
  );

  return (
    <DrawerContentScrollView 
      {...props}
      style={{backgroundColor: isDarkMode ? '#121212' : '#ffffff'}}
    >
      <View style={styles.drawerContent}>
        <TouchableOpacity onPress={() => setIsProfileModalVisible(true)} style={styles.profileButton}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]} />
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.name, {color: isDarkMode ? '#ffffff' : '#000000'}]}>
              {profileName || t('user')}
            </Text>
          </View>
        </TouchableOpacity>

        <Divider style={[styles.divider, { backgroundColor: isDarkMode ? '#ffffff' : '#000000' }]} />

        <DrawerItem
          icon={() => <DrawerItemIcon name="home-outline" />}
          label={t('home')}
          onPress={() => props.navigation.navigate('Home')}
          labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
        />


        <DrawerItem
          icon={() => <DrawerItemIcon name="library-outline" />}
          label={t('myLibrary')}
          onPress={() => props.navigation.navigate('Library')}
          labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
        />
        <DrawerItem
          icon={() => <DrawerItemIcon name="search-outline" />}
          label={t('explore')}
          onPress={() => props.navigation.navigate('Search')}
          labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
        />
        <DrawerItem
          icon={() => <DrawerItemIcon name="add-circle-outline" />}
          label={t('createSong')}
          onPress={() => props.navigation.navigate('Create')}
          labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
        />
        <DrawerItem
          icon={() => <DrawerItemIcon name="download-outline" />}
          label={t('downloads')}
          onPress={() => props.navigation.navigate('Download')}
          labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
        />
        <DrawerItem
          icon={() => <DrawerItemIcon name="heart-outline" />}
          label={t('favorites')}
          onPress={() => props.navigation.navigate('Favorites')}
          labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
        />

        <Divider style={[styles.divider, { backgroundColor: isDarkMode ? '#ffffff' : '#000000' }]} />
<DrawerItem
  icon={() => <DrawerItemIcon name="settings-outline" />}
  label={t('central')}
  onPress={() => props.navigation.navigate('Central')}
  labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
/>
        <Divider style={[styles.divider, { backgroundColor: isDarkMode ? '#ffffff' : '#000000' }]} />
          <DrawerItem
          icon={() => <DrawerItemIcon name="cloud-offline-outline" />}
          label={t('offline')}
          onPress={() => props.navigation.navigate('Offline')}
          labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
        />
<Divider style={[styles.divider, { backgroundColor: isDarkMode ? '#ffffff' : '#000000' }]} />
      <DrawerItem
          icon={() => <DrawerItemIcon name="settings-outline" />}
          label={t('settings')}
          onPress={() => props.navigation.navigate('Settings')}
          labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
        />
        <DrawerItem
          icon={() => <DrawerItemIcon name="person-outline" />}
          label={t('profile')}
          onPress={() => props.navigation.navigate('Profile')}
          labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
        />
        <DrawerItem
          icon={() => <DrawerItemIcon name="help-circle-outline" />}
          label={t('helpAndSupport')}
          onPress={() => props.navigation.navigate('HelpSupport')}
          labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
        />

        <Divider style={[styles.divider, { backgroundColor: isDarkMode ? '#ffffff' : '#000000' }]} />

    
 

        <View style={styles.preference}>
          <Text style={{color: isDarkMode ? '#ffffff' : '#000000'}}>
            {isDarkMode ? t('lightMode') : t('darkMode')}
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>

        <DrawerItem
          icon={() => <DrawerItemIcon name="log-out-outline" />}
          label={t('logout')}
          onPress={handleLogout}
          labelStyle={[styles.drawerLabel, {color: isDarkMode ? '#ffffff' : '#000000'}]}
        />
      </View>
      
      <ProfileComponent 
        isVisible={isProfileModalVisible} 
        onClose={() => setIsProfileModalVisible(false)} 
        onProfileUpdate={loadProfileData}
      />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    paddingTop: 10,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  placeholderAvatar: {
    backgroundColor: '#E1E1E1',
  },
  profileInfo: {
    flexDirection: 'column',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 10,
  },
  drawerLabel: {
    fontSize: 16,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
});

export default DrawerContent;