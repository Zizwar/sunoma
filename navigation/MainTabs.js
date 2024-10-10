import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';
import { useTranslation } from 'react-i18next';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CreateSongScreen from '../screens/CreateSongScreen';
import LibraryScreen from '../screens/LibraryScreen';
import PlaylistDetailsScreen from '../screens/PlaylistDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen'; 
import CentralScreen from '../screens/CentralScreen';
import MeScreen from '../screens/MeScreen';
import NetworkLogsScreen from '../screens/NetworkLogsScreen';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CreateButton = ({ onPress }) => (
  <TouchableOpacity style={styles.createButton} onPress={onPress}>
    <Icon name="add-circle" type="ionicon" size={30} color="#FFFFFF" />
  </TouchableOpacity>
);

const LibraryStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Library" component={LibraryScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PlaylistDetails" component={PlaylistDetailsScreen} options={{ title: 'Playlist' }} />
  </Stack.Navigator>
);
const MeLibraryStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Me" component={MeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PlaylistDetails" component={PlaylistDetailsScreen} options={{ title: 'Playlist' }} />
  </Stack.Navigator>
);
const MainTabs = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'LibraryStack') {
            iconName = focused ? 'library' : 'library-outline';
       }   else if (route.name === 'meLibraryStack') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }else if (route.name === 'Central') {
            iconName = focused ? 'code' : 'code-outline';
          }

          return <Icon name={iconName} type="ionicon" size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: t('search') }} />
      <Tab.Screen
        name="Create"
        component={CreateSongScreen}
        options={{
          tabBarButton: (props) => <CreateButton {...props} />,
          title: t('create'),
        }}
      />
      <Tab.Screen 
        name="LibraryStack" 
        component={LibraryStack} 
        options={{ 
          title: t('library'),
          tabBarLabel: t('library'),
        }} 
      />
        <Tab.Screen 
        name="MeLibraryStack" 
        component={MeLibraryStack} 
        options={{ 
          title: t('melibrary'),
          tabBarLabel: t('melibrary'),
        }} 
      />
   <Stack.Screen name="Central" component={CentralScreen} options={{ 
          title: t('central'),
          tabBarLabel: t('central'),
        }} />
<Stack.Screen name="NetworkLogs" component={NetworkLogsScreen} options={{ title: 'Network Logs' }} />
       <Stack.Screen name="Profile" component={ProfileScreen} options={{ 
          title: t('profile'),
          tabBarLabel: t('profile'),
        }} />
     
            </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: '#6366F1',
    width: 76,
    height: 76,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 45,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MainTabs;