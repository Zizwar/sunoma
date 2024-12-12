import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { ThemeProvider as RNEThemeProvider, Icon } from 'react-native-elements';
import { I18nextProvider } from 'react-i18next';
import { useKeepAwake } from 'expo-keep-awake';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import i18n from './src/i18n';
import DrawerContent from './navigation/DrawerContent';
import AudioManager from './utils/AudioManager';
import { setupNotifications } from './utils/NotificationManager';
import { ThemeProvider, ThemeContext } from './utils/ThemeContext';
import { startBackgroundAudio } from './utils/BackgroundAudioTask';
import MiniPlayer from './components/MiniPlayer';
import PlayerModal from './components/PlayerModal';
import WebAudioPlayer from './components/WebAudioPlayer';
import { NotificationIcon, NotificationsModal } from './components/NotificationsComponent';


import MainTabs from './navigation/MainTabs';
import DownloadScreen from './screens/DownloadScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import SettingsScreen from './screens/SettingsScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import OfflineScreen from './screens/OfflineScreen';
import DynamicSplashScreen from './screens/DynamicSplashScreen';
import { linking } from './navigation/linking';

export const AudioContext = React.createContext();

const Drawer = createDrawerNavigator();

const AppContent = () => {
  const [audioState, setAudioState] = useState({
    currentSong: null,
    isPlaying: false,
    position: 0,
    duration: 0,
  });
  const { isDarkMode } = useContext(ThemeContext);
  const [miniPlayerVisible, setMiniPlayerVisible] = useState(false);
  const [playerModalVisible, setPlayerModalVisible] = useState(false);
  const [isWebAudioMode, setIsWebAudioMode] = useState(false);
  const [webViewRef, setWebViewRef] = useState(null);
  const [appIsReady, setAppIsReady] = useState(false);
const [notificationsVisible, setNotificationsVisible] = useState(false);
 

  useKeepAwake();

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await setupNotifications();
        await startBackgroundAudio();
        await AudioManager.initAudioMode();
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  useEffect(() => {
    const updateAudioState = () => {
      setAudioState({
        currentSong: AudioManager.currentSong,
        isPlaying: AudioManager.isPlaying,
        position: AudioManager.position,
        duration: AudioManager.duration,
      });
    };

    AudioManager.addListener(updateAudioState);

    return () => {
      AudioManager.removeListener(updateAudioState);
      AudioManager.unloadCurrentAudio();
    };
  }, []);

  useEffect(() => {
    AudioManager.setWebAudioMode(isWebAudioMode);
  }, [isWebAudioMode]);

  const handlePlayPause = useCallback(async () => {
    await AudioManager.playPause();
  }, []);

  const handleNext = useCallback(async () => {
    await AudioManager.playNext();
  }, []);

  const handlePrevious = useCallback(async () => {
    await AudioManager.playPrevious();
  }, []);

  const handleSetPosition = useCallback(async (newPosition) => {
    await AudioManager.setPosition(newPosition);
  }, []);

  const handleSongSelect = useCallback(async (song, playlist, index) => {
    await AudioManager.handleSongSelect(song, playlist, index);
    setMiniPlayerVisible(true);
  }, []);

  const toggleMiniPlayer = useCallback(() => {
    setMiniPlayerVisible((prev) => !prev);
  }, []);

  const togglePlayerModal = useCallback(() => {
    setPlayerModalVisible((prev) => !prev);
  }, []);

  const handleWebViewReady = useCallback((ref) => {
    setWebViewRef(ref);
    AudioManager.setWebViewRef(ref);
  }, []);

  /*const toggleWebAudioMode = useCallback(() => {
    setIsWebAudioMode((prev) => !prev);
  }, []);
*/

  const toggleWebAudioMode = async () => {
    const newMode = !isWebAudioMode;
    setIsWebAudioMode(newMode);
    if (audioState.currentSong) {
      await AudioManager.checkAndSwitchAudioMode(audioState.currentSong.audio_url);
    }
  };

  const lightTheme = {
    colors: {
      primary: '#6200ee',
      background: '#ffffff',
      text: '#000000',
      grey2: '#757575',
      grey5: '#e0e0e0',
    },
  };

  const darkTheme = {
    colors: {
      primary: '#bb86fc',
      background: '#121212',
      text: '#ffffff',
      grey2: '#b0b0b0',
      grey5: '#2c2c2c',
    },
  };

  if (!appIsReady) {
    return <DynamicSplashScreen />;
  }

  return (
    <RNEThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <I18nextProvider i18n={i18n}>
        <AudioContext.Provider
          value={{
            ...audioState,
            handlePlayPause,
            handleNext,
            handlePrevious,
            setPosition: handleSetPosition,
            handleSongSelect,
            miniPlayerVisible,
            setMiniPlayerVisible,
            toggleMiniPlayer,
            playerModalVisible,
            togglePlayerModal,
            isWebAudioMode,
            toggleWebAudioMode,
          }}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer linking={linking}>
              <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                <Drawer.Navigator
                  drawerContent={(props) => <DrawerContent {...props} />}
                  screenOptions={({ navigation }) => ({
                    headerShown: true,
                    headerStyle: {
                      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                    },
                    headerTintColor: isDarkMode ? '#ffffff' : '#000000',
                    headerLeft: () => (
                      <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
                        <Icon name="menu" type="material" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
                      </TouchableOpacity>
                    ),
                   headerRight: () => (
                      <View style={{ flexDirection: 'row' }}>

    
        
        <TouchableOpacity onPress={() => navigation.navigate('Search')} style={{ marginLeft: 15 }}>
          <Icon name="search" size={24} color="#000" />
        </TouchableOpacity>
      





                        
                        <TouchableOpacity onPress={toggleWebAudioMode} style={{ marginRight: 15 }}>
                          <Icon
                            name= "speaker"
                            type="material"
                            size={24}
                            color={
                                isWebAudioMode
                                  ? '#1DB954'
                                  : isDarkMode
                                  ? '#ffffff'
                                  : '#000000'
                              }
                          />
                        </TouchableOpacity>
                        {audioState.currentSong && (
                          <TouchableOpacity
                            onPress={toggleMiniPlayer}
                            style={{ marginRight: 15 }}>
                            <Icon
                              name="headset"
                              type="material"
                              size={24}
                              color={
                                miniPlayerVisible
                                  ? '#1DB954'
                                  : isDarkMode
                                  ? '#ffffff'
                                  : '#000000'
                              }
                            />
                          </TouchableOpacity>
                        )}
                        <NotificationIcon 
          onPress={() => setNotificationsVisible(true)} 
          unreadCount={2} // You might want to make this dynamic
        />
                      </View>
                    ),
                  })}>
                  <Drawer.Screen name="MainTabs" component={MainTabs} options={{ title: 'Suno' }} />
                  <Drawer.Screen name="Download" component={DownloadScreen} />
                  <Drawer.Screen name="Favorites" component={FavoritesScreen} />
                  <Drawer.Screen name="Settings" component={SettingsScreen} />
                  <Drawer.Screen name="HelpSupport" component={HelpSupportScreen} />
                  <Drawer.Screen name="Offline" component={OfflineScreen} />
                </Drawer.Navigator>
                {audioState.currentSong && miniPlayerVisible && (
                  <View style={styles.miniPlayerContainer}>
                    <MiniPlayer />
                  </View>
                )}
              </View>
            </NavigationContainer>
<NotificationsModal 
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />

            <PlayerModal
              visible={playerModalVisible}
              onClose={togglePlayerModal}
            />
          </GestureHandlerRootView>
          {isWebAudioMode && (
            <WebAudioPlayer onReady={handleWebViewReady} />
          )}
        </AudioContext.Provider>
      </I18nextProvider>
    </RNEThemeProvider>
  );
};

const styles = StyleSheet.create({
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 49,
    left: 0,
    right: 0,
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}