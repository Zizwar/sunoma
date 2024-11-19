import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Modal, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { getSongMetadata } from '../utils/fetchSongs';

const { width, height } = Dimensions.get('window');

const SongDetailsModal = ({ visible, song, onClose, theme }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (song && visible) {
      fetchMetadata();
    }
  }, [song, visible]);

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      const data = await getSongMetadata([song.id]);
      if (data && data.metadata && data.metadata.length > 0) {
        setMetadata(data.metadata[0]);
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
      Alert.alert('Error', 'Failed to fetch song details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type) => {
    if (!metadata) return;

    try {
      let url;
      let fileName;
      switch (type) {
        case 'video':
          url = metadata.video_url;
          fileName = `${metadata.id}_video.mp4`;
          break;
        case 'mp3':
          url = metadata.audio_url;
          fileName = `${metadata.id}_audio.mp3`;
          break;
        case 'wave':
          url = metadata.audio_url.replace('.mp3', '.wav');
          fileName = `${metadata.id}_audio.wav`;
          break;
        default:
          throw new Error('Invalid download type');
      }

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
      const { uri } = await downloadResumable.downloadAsync();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', `File downloaded to ${uri}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download the file.');
    }
  };

  const handleVideoPlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const copyPromptToClipboard = async () => {
    if (metadata && metadata.metadata.prompt) {
      await Clipboard.setStringAsync(metadata.metadata.prompt);
      Alert.alert('Success', 'Prompt copied to clipboard');
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (!song || !metadata) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <>
            <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
              <BlurView intensity={100} style={StyleSheet.absoluteFill} />
              <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
                {metadata.title || 'Untitled'}
              </Text>
            </Animated.View>
            
            <Animated.ScrollView
              style={styles.scrollView}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
            >
              <Image source={{ uri: metadata.image_large_url }} style={styles.image} />
              <LinearGradient
                colors={['transparent', theme.colors.background]}
                style={styles.gradientOverlay}
              />
              <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: theme.colors.text }]}>{metadata.title || 'Untitled'}</Text>
                <Text style={[styles.artist, { color: theme.colors.grey3 }]}>{metadata.display_name}</Text>

                <View style={styles.statsContainer}>
                  <StatItem icon="play" value={metadata.play_count} label="Plays" theme={theme} />
                  <StatItem icon="heart" value={metadata.upvote_count} label="Likes" theme={theme} />
                  <StatItem icon="calendar" value={new Date(metadata.created_at).toLocaleDateString()} label="Created" theme={theme} />
                </View>

                <View style={styles.actionButtons}>
                  <ActionButton icon="play" label="Play" onPress={handleVideoPlayPause} theme={theme} />
                  <ActionButton icon="heart" label="Like" onPress={() => {}} theme={theme} />
                  <ActionButton icon="share" label="Share" onPress={() => {}} theme={theme} />
                </View>

                <View style={styles.promptContainer}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Prompt</Text>
                  <Text
                    style={[styles.prompt, { color: theme.colors.text }]}
                    numberOfLines={showFullPrompt ? undefined : 3}
                  >
                    {metadata.metadata.prompt}
                  </Text>
                  <TouchableOpacity onPress={() => setShowFullPrompt(!showFullPrompt)}>
                    <Text style={[styles.showMoreLess, { color: theme.colors.primary }]}>
                      {showFullPrompt ? 'Show Less' : 'Show More'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={copyPromptToClipboard} style={styles.copyButton}>
                    <Icon name="content-copy" type="material" size={20} color={theme.colors.primary} />
                    <Text style={[styles.copyText, { color: theme.colors.primary }]}>Copy Prompt</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.downloadSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Download</Text>
                  <View style={styles.downloadButtons}>
                    <DownloadButton icon="video" text="Video" onPress={() => handleDownload('video')} theme={theme} />
                    <DownloadButton icon="music" text="MP3" onPress={() => handleDownload('mp3')} theme={theme} />
                    <DownloadButton icon="wave-square" text="Wave" onPress={() => handleDownload('wave')} theme={theme} />
                  </View>
                </View>

                <TouchableOpacity onPress={handleVideoPlayPause} style={styles.videoContainer}>
                  <Video
                    source={{ uri: metadata.video_url }}
                    rate={1.0}
                    volume={1.0}
                    isMuted={false}
                    resizeMode="contain"
                    shouldPlay={isPlaying}
                    isLooping
                    style={styles.video}
                  />
                  <Icon
                    name={isPlaying ? 'pause' : 'play'}
                    type="font-awesome"
                    color="#fff"
                    size={50}
                    containerStyle={styles.playIcon}
                  />
                </TouchableOpacity>
              </View>
            </Animated.ScrollView>
          </>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" type="material" size={30} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const StatItem = ({ icon, value, label, theme }) => (
  <View style={styles.statItem}>
    <Icon name={icon} type="font-awesome" size={18} color={theme.colors.grey3} />
    <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: theme.colors.grey3 }]}>{label}</Text>
  </View>
);

const ActionButton = ({ icon, label, onPress, theme }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Icon name={icon} type="font-awesome" size={24} color={theme.colors.primary} />
    <Text style={[styles.actionLabel, { color: theme.colors.text }]}>{label}</Text>
  </TouchableOpacity>
);

const DownloadButton = ({ icon, text, onPress, theme }) => (
  <TouchableOpacity style={[styles.downloadButton, { backgroundColor: theme.colors.primary }]} onPress={onPress}>
    <Icon name={icon} type="font-awesome" size={20} color="#fff" />
    <Text style={styles.downloadButtonText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: width,
    height: width,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  artist: {
    fontSize: 18,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionLabel: {
    marginTop: 5,
  },
  promptContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  prompt: {
    fontSize: 14,
    lineHeight: 20,
  },
  showMoreLess: {
    marginTop: 5,
    fontWeight: 'bold',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  copyText: {
    marginLeft: 5,
    fontWeight: 'bold',
  },
  downloadSection: {
    marginBottom: 20,
  },
  downloadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  downloadButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playIcon: {
    position: 'absolute',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
});

export default SongDetailsModal;