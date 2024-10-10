import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Slider, Icon } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/CreateSongStyles';

const ContinueClipSection = ({
  continueClip,
  selectedTime,
  setSelectedTime,
  setContinueClip,
  theme
}) => {
  const { t } = useTranslation();
  const [continueGroupVisible, setContinueGroupVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    } else if (continueClip?.audioUrl) {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: continueClip.audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
    }
  };

  const handleRemoveContinue = () => {
    setContinueClip(null);
    setSelectedTime(0);
  };

  return (
    <View style={styles.continueGroup}>
      <TouchableOpacity onPress={() => setContinueGroupVisible(!continueGroupVisible)} style={styles.groupHeader}>
        <Text style={[styles.groupTitle, { color: theme.colors.text }]}>{t('continueSong')}</Text>
        <Icon
          name={continueGroupVisible ? 'chevron-up' : 'chevron-down'}
          type="material-community"
          color={theme.colors.text}
        />
      </TouchableOpacity>
      {continueGroupVisible && (
        <View>
          <Text style={{ color: theme.colors.text }}>{t('selectedSong', { title: continueClip.title })}</Text>
          <Text style={{ color: theme.colors.text }}>{t('duration', { duration: Math.floor(continueClip.time) })}</Text>
          <View style={styles.sliderContainer}>
            <Slider
              value={selectedTime}
              onValueChange={setSelectedTime}
              minimumValue={1}
              maximumValue={Math.floor(continueClip.time)}
              step={1}
              thumbTintColor={theme.colors.primary}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.grey3}
              style={styles.slider}
            />
            <Text style={[styles.timeText, { color: theme.colors.text }]}>{selectedTime}s</Text>
          </View>
          <View style={styles.continueControls}>
            <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
              <Icon
                name={isPlaying ? 'pause' : 'play-arrow'}
                type="material"
                color={theme.colors.primary}
                size={30}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRemoveContinue} style={styles.removeButton}>
              <Icon
                name="delete"
                type="material"
                color={theme.colors.error}
                size={30}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default ContinueClipSection;