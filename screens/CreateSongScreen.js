import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { Card, Button, useTheme, Text, Icon } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreateSongForm from '../components/CreateSongForm';
import ContinueClipSection from '../components/ContinueClipSection';
import ControlButtons from '../components/ControlButtons';
import { generateSong } from '../utils/fetchSongs';
//import { showInterstitialAd } from '../utils/AdManager';
const CreateSongScreen = ({ navigation, route, isModal = false, onClose }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [prompt, setPrompt] = useState('');
  const [makeInstrumental, setMakeInstrumental] = useState(false);
  const [continueClip, setContinueClip] = useState(null);
  const [selectedTime, setSelectedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText300, setInputText300] = useState('');
  const [inputModalVisible, setInputModalVisible] = useState(false);
 
  useEffect(() => {
    if (route?.params?.song) {
      const { song, continueClip } = route.params;
      setTitle(song.title);
      setTag(song.metadata?.tags || '');
      setPrompt(song.metadata?.prompt || '');
      setMakeInstrumental(song.metadata?.has_vocal === false);
      if (continueClip) {
        setContinueClip(continueClip);
        setSelectedTime(continueClip.time);
      }
    }
  }, [route?.params?.song, route?.params?.continueClip]);

  const handleGenerate = async () => {
    Alert.alert(
      t('confirmGenerate'),
      t('areYouSureGenerate'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('yes'),
          onPress: async () => {
            setIsLoading(true);
            const requestData = {
              title,
              tags: tag,
              prompt: makeInstrumental ? null : prompt,
              continue_clip_id: continueClip?.id,
              continue_at: selectedTime,
              make_instrumental: makeInstrumental,
              mv: 'chirp-v3-5',
            };

            try {
              const result = await generateSong(requestData);
              Alert.alert(t('success'), t('songGeneratedSuccess'));
              
              // تحديث الشاشة الرئيسية وتوجيه المستخدم إليها
              if (isModal && onClose) {
                onClose();
              }
              navigation.navigate('Home', { refresh: true });
            } catch (error) {
              console.error('Error generating song:', error);
              Alert.alert(t('error'), t('songGenerationFailed'));
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };
  const handleInputSubmit = async () => {
    if (inputText300.length > 300) {
      Alert.alert(t('error'), t('inputTooLong'));
      return;
    }

    setIsLoading(true);
    const promptSong = `${inputText300}__${prompt}`;
    try {
      const response = await fetch(`https://suno.deno.dev/generate-lyrics?prompt=${encodeURIComponent(promptSong)}`);
      const data = await response.json();

      if (data.lyrics.status === 'complete') {
        setTitle(data.lyrics.title);
        setPrompt(data.lyrics.text);
        setInputModalVisible(false);
        setInputText300('');
      } else {
        Alert.alert(t('error'), t('lyricsGenerationIncomplete'));
      }
    } catch (error) {
      console.error('Error generating lyrics:', error);
      Alert.alert(t('error'), t('lyricsGenerationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text h3 style={[styles.headerText, { color: theme.colors.text }]}>
          {isModal ? t('createNewSong') : t('createSong')}
        </Text>
        {isModal && (
          <Button
            icon={<Icon name="close" size={24} color={theme.colors.text} />}
            type="clear"
            onPress={onClose}
          />
        )}
      </View>

      <Card containerStyle={[styles.formCard, { backgroundColor: theme.colors.background }]}>
        <CreateSongForm
          title={title}
          setTitle={setTitle}
          tag={tag}
          setTag={setTag}
          prompt={prompt}
          setPrompt={setPrompt}
          makeInstrumental={makeInstrumental}
          setMakeInstrumental={setMakeInstrumental}
          theme={theme}
        />
      </Card>

      {continueClip && (
        <Card containerStyle={[styles.continueClipCard, { backgroundColor: theme.colors.background }]}>
          <ContinueClipSection
            continueClip={continueClip}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            setContinueClip={setContinueClip}
            theme={theme}
          />
        </Card>
      )}

      <View style={[styles.controlCard, { backgroundColor: theme.colors.background }]}>
        <ControlButtons
          title={title}
          tag={tag}
          setTag={setTag}
          prompt={prompt}
          setPrompt={setPrompt}
          makeInstrumental={makeInstrumental}
          continueClip={continueClip}
          selectedTime={selectedTime}
          handleGenerate={handleGenerate}
          isLoading={isLoading}
          isModal={isModal}
          onClose={onClose}
          theme={theme}
          navigation={navigation}
          onLoadSavedItem={(savedItem) => {
            setTitle(savedItem.title);
            setTag(savedItem.tag);
            setPrompt(savedItem.prompt);
            setMakeInstrumental(savedItem.makeInstrumental);
            setContinueClip(savedItem.continueClip);
            setSelectedTime(savedItem.selectedTime);
          }}
          inputText300={inputText300}
          setInputText300={setInputText300}
          inputModalVisible={inputModalVisible}
          setInputModalVisible={setInputModalVisible}
          handleInputSubmit={handleInputSubmit}
        />
      </View>
{/*
      <Button
        title={t('generate')}
        onPress={handleGenerate}
        loading={isLoading}
        containerStyle={styles.generateButton}
        buttonStyle={{ backgroundColor: theme.colors.primary }}
        titleStyle={{ fontWeight: 'bold' }}
        icon={<Icon name="music" type="font-awesome" color="white" size={20} style={{ marginRight: 10 }} />}
      />
      */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontWeight: 'bold',
  },
  formCard: {
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  continueClipCard: {
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  controlCard: {
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  generateButton: {
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 25,
    overflow: 'hidden',
  },
});

export default CreateSongScreen;