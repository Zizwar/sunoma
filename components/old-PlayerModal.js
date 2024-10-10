import React, { useContext, useState, useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, Image, TouchableOpacity, Dimensions, PanResponder } from 'react-native';
import { Text, Slider, Icon, useTheme } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { AudioContext } from '../App';
import AudioManager from '../utils/AudioManager';
import SongDetailsModal from './SongDetailsModal';

const { width, height } = Dimensions.get('window');

const PlayerModal = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { currentSong, isPlaying, handlePlayPause, handleNext, handlePrevious } = useContext(AudioContext);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [repeatMode, setRepeatMode] = useState('none');
  const [isSeeking, setIsSeeking] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const positionRef = useRef(position);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSeeking) {
        setPosition(AudioManager.position);
        positionRef.current = AudioManager.position;
      }
      setDuration(AudioManager.duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSeeking]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 50) {
        onClose();
      }
    },
  });

  const handleSliderChange = (value) => {
    setPosition(value);
    positionRef.current = value;
  };

  const handleSliderComplete = async () => {
    await AudioManager.setPosition(positionRef.current);
    setIsSeeking(false);
  };

  const handleVolumeChange = async (value) => {
    setVolume(value);
    await AudioManager.setVolume(value);
  };

  const handleRepeatModeChange = () => {
    const modes = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
    AudioManager.setRepeatMode(modes[nextIndex]);
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return 'repeat-one';
      case 'all':
        return 'repeat';
      default:
        return 'repeat-off';
    }
  };

  if (!currentSong) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]} {...panResponder.panHandlers}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="chevron-down" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.infoButton} onPress={() => setDetailsModalVisible(true)}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Image source={{ uri: currentSong.image_url }} style={styles.image} />
        <Text style={[styles.title, { color: theme.colors.text }]}>{currentSong.title.substr(0,64)}</Text>
        <Text style={[styles.artist, { color: theme.colors.grey3 }]}>{currentSong.artist}</Text>
        <Slider
          value={position}
          maximumValue={duration}
          onValueChange={handleSliderChange}
          onSlidingStart={() => setIsSeeking(true)}
          onSlidingComplete={handleSliderComplete}
          thumbStyle={{ height: 20, width: 20 }}
          thumbTintColor={theme.colors.primary}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.grey3}
          style={styles.slider}
        />
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: theme.colors.grey3 }]}>{formatTime(position)}</Text>
          <Text style={[styles.timeText, { color: theme.colors.grey3 }]}>{formatTime(duration)}</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity onPress={handlePrevious}>
            <Ionicons name="play-skip-back" size={32} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseButton}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={48} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext}>
            <Ionicons name="play-skip-forward" size={32} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.bottomControls}>
          <TouchableOpacity onPress={handleRepeatModeChange}>
            <Ionicons name={getRepeatIcon()} size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.volumeContainer}>
            <Ionicons name="volume-low" size={24} color={theme.colors.text} />
            <Slider
              value={volume}
              onValueChange={handleVolumeChange}
              thumbStyle={{ height: 15, width: 15 }}
              thumbTintColor={theme.colors.primary}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.grey3}
              style={styles.volumeSlider}
            />
            <Ionicons name="volume-high" size={24} color={theme.colors.text} />
          </View>
        </View>
      </View>
      <SongDetailsModal
        visible={detailsModalVisible}
        song={currentSong}
        onClose={() => setDetailsModalVisible(false)}
        theme={theme}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  infoButton: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  artist: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  timeText: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 30,
  },
  playPauseButton: {
    marginHorizontal: 30,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 20,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 10,
  },
});

export default PlayerModal;