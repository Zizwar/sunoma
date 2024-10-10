import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Icon, Overlay, ListItem, Input, Text } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InstrumentModal from './InstrumentModal';
import AdvancedPromptModal from './AdvancedPromptModal';
import structures from '../data/structures.json';

const ControlButtons = ({
  title,
  tag,
  prompt,
  setPrompt,
  setTag,
  makeInstrumental,
  continueClip,
  selectedTime,
  handleGenerate,
  isLoading,
  isModal,
  onClose,
  theme,
  inputText300,
  setInputText300,
  inputModalVisible,
  setInputModalVisible,
  handleInputSubmit,
  onLoadSavedItem,
}) => {
  const { t } = useTranslation();
  const [instrumentModalVisible, setInstrumentModalVisible] = useState(false);
  const [structureOptionsVisible, setStructureOptionsVisible] = useState(false);
  const [advancedPromptModalVisible, setAdvancedPromptModalVisible] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [savedItemsOverlayVisible, setSavedItemsOverlayVisible] = useState(false);
  const [saveNameModalVisible, setSaveNameModalVisible] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = async () => {
    try {
      const savedItemsString = await AsyncStorage.getItem('savedItems');
      if (savedItemsString) {
        setSavedItems(JSON.parse(savedItemsString));
      }
    } catch (error) {
      console.error('Error loading saved items:', error);
    }
  };

  const handleAssistantButton = () => {
    setInputModalVisible(true);
  };

  const handleSave = async () => {
    setSaveName(title);
    setSaveNameModalVisible(true);
  };

  const confirmSave = async () => {
    try {
      const newItem = {
        name: saveName,
        title,
        tag,
        prompt,
        makeInstrumental,
        continueClip,
        selectedTime,
      };
      const updatedItems = [...savedItems, newItem];
      await AsyncStorage.setItem('savedItems', JSON.stringify(updatedItems));
      setSavedItems(updatedItems);
      Alert.alert(t('success'), t('itemSavedSuccess'));
      setSaveNameModalVisible(false);
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert(t('error'), t('itemSaveFailed'));
    }
  };

  const handleLoadSavedItem = (savedItem) => {
    if (typeof onLoadSavedItem === 'function') {
      onLoadSavedItem(savedItem);
    }
    setSavedItemsOverlayVisible(false);
  };

  const handleDeleteSavedItem = async (index) => {
    try {
      const updatedItems = savedItems.filter((_, i) => i !== index);
      await AsyncStorage.setItem('savedItems', JSON.stringify(updatedItems));
      setSavedItems(updatedItems);
      Alert.alert(t('success'), t('itemDeletedSuccess'));
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert(t('error'), t('itemDeleteFailed'));
    }
  };

  const handleModalSelect = (item, type) => {
    if (type === 'instrument' || type === 'structure') {
      setPrompt((prevPrompt) => prevPrompt + `${item.value}\n`);
      if (type === 'structure') {
        setTag((prevTag) => prevTag ? `${prevTag}, ${item.text}` : item.text);
      }
    }

    if (type === 'instrument') setInstrumentModalVisible(false);
    if (type === 'structure') setStructureOptionsVisible(false);
  };

  const styles = StyleSheet.create({
    container: {
      padding: 10,
    },
    buttonGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    gridButton: {
      flex: 1,
      marginHorizontal: 5,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    buttonText: {
      color: '#ffffff',
      marginTop: 5,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: 5,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    generateButton: {
      marginTop: 10,
      borderRadius: 25,
      padding: 15,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    overlay: {
      width: '90%',
      borderRadius: 15,
      padding: 20,
    },
    savedItemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.grey5,
    },
    savedItemName: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    savedItemButtons: {
      flexDirection: 'row',
    },
    iconButton: {
      marginLeft: 10,
    },
    structureItem: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.grey5,
    },
    structureText: {
      fontSize: 16,
      color: theme.colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.gridButton, { backgroundColor: '#FF9800' }]}
        onPress={handleAssistantButton}
      >
        <Icon name="assistant" color="#ffffff" size={24} />
        <Text style={styles.buttonText}>{t('smartAssistant')}</Text>
      </TouchableOpacity>

      <View style={styles.buttonGrid}>
        {[
          { title: 'structure', icon: 'format-list-bulleted', onPress: () => setStructureOptionsVisible(true), color: '#3498db' },
          { title: 'instrument', icon: 'music-note', onPress: () => setInstrumentModalVisible(true), color: '#2ecc71' },
          { title: 'advanced', icon: 'edit', onPress: () => setAdvancedPromptModalVisible(true), color: '#e74c3c' },
        ].map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.gridButton, { backgroundColor: button.color }]}
            onPress={button.onPress}
          >
            <Icon name={button.icon} color="#ffffff" size={24} />
            <Text style={styles.buttonText}>{t(button.title)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionButtons}>
        {[
          { title: 'save', icon: 'save', onPress: handleSave, color: '#f39c12' },
          { title: 'savedList', icon: 'list', onPress: () => setSavedItemsOverlayVisible(true), color: '#9b59b6' },
        ].map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { backgroundColor: button.color }]}
            onPress={button.onPress}
          >
            <Icon name={button.icon} color="#ffffff" size={24} />
            <Text style={styles.buttonText}>{t(button.title)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.generateButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleGenerate}
        disabled={isLoading}
      >
        <Icon name="noise-aware" color="#ffffff" size={24} />
        <Text style={[styles.buttonText, { marginLeft: 10, fontSize: 16 }]}>
          {isLoading ? t('generating') : t('generate')}
        </Text>
      </TouchableOpacity>

      <Overlay
        isVisible={inputModalVisible}
        onBackdropPress={() => setInputModalVisible(false)}
        overlayStyle={[styles.overlay, { backgroundColor: theme.colors.background }]}
      >
        <Input
          value={inputText300}
          onChangeText={setInputText300}
          placeholder={t('enterUpTo300Chars')}
          inputStyle={{ color: theme.colors.text }}
          labelStyle={{ color: theme.colors.text }}
          placeholderTextColor={theme.colors.grey3}
          multiline
          numberOfLines={3}
          maxLength={300}
        />
        <Button
          title={isLoading ? t('generating') : t('submit')}
          onPress={handleInputSubmit}
          disabled={isLoading}
          loading={isLoading}
          buttonStyle={{ backgroundColor: theme.colors.primary, marginTop: 10 }}
        />
        <Button
          title={t('cancel')}
          onPress={() => setInputModalVisible(false)}
          type="outline"
          buttonStyle={{ borderColor: theme.colors.primary, marginTop: 10 }}
          titleStyle={{ color: theme.colors.primary }}
        />
      </Overlay>
      
      <InstrumentModal
        visible={instrumentModalVisible}
        onClose={() => setInstrumentModalVisible(false)}
        onSelectInstrument={(value) => handleModalSelect({ value }, 'instrument')}
        theme={theme}
      />

      <Overlay
        isVisible={structureOptionsVisible}
        onBackdropPress={() => setStructureOptionsVisible(false)}
        overlayStyle={[styles.overlay, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView style={{ maxHeight: '80%' }}>
          {structures.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.structureItem}
              onPress={() => handleModalSelect(item, 'structure')}
            >
              <Text style={styles.structureText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button
          title={t('close')}
          onPress={() => setStructureOptionsVisible(false)}
          buttonStyle={{ backgroundColor: theme.colors.primary, marginTop: 10 }}
        />
      </Overlay>

      <AdvancedPromptModal
        visible={advancedPromptModalVisible}
        onClose={() => setAdvancedPromptModalVisible(false)}
        onUpdatePrompt={setPrompt}
        prompt={prompt}
        theme={theme}
      />
      
      <Overlay
        isVisible={savedItemsOverlayVisible}
        onBackdropPress={() => setSavedItemsOverlayVisible(false)}
        overlayStyle={[styles.overlay, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView style={{ maxHeight: '80%' }}>
          {savedItems.map((item, index) => (
            <View key={index} style={styles.savedItemContainer}>
              <Text style={styles.savedItemName}>{item.name}</Text>
              <View style={styles.savedItemButtons}>
                <TouchableOpacity onPress={() => handleLoadSavedItem(item)} style={styles.iconButton}>
                  <Icon name="edit" color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteSavedItem(index)} style={styles.iconButton}>
                  <Icon name="delete" color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        <Button
          title={t('close')}
          onPress={() => setSavedItemsOverlayVisible(false)}
          buttonStyle={{ backgroundColor: theme.colors.primary, marginTop: 10 }}
        />
      </Overlay>

      <Overlay
        isVisible={saveNameModalVisible}
        onBackdropPress={() => setSaveNameModalVisible(false)}
        overlayStyle={[styles.overlay, { backgroundColor: theme.colors.background }]}
      >
        <Input
          label={t('itemName')}
          value={saveName}
          onChangeText={setSaveName}
          placeholder={t('enterItemName')}
          inputStyle={{ color: theme.colors.text }}
          labelStyle={{ color: theme.colors.text }}
          placeholderTextColor={theme.colors.grey3}
        />
        <Button
          title={t('save')}
          onPress={confirmSave}
          buttonStyle={{ backgroundColor: theme.colors.primary, marginTop: 10 }}
        />
        <Button
          title={t('cancel')}
          onPress={() => setSaveNameModalVisible(false)}
          type="outline"
          buttonStyle={{ borderColor: theme.colors.primary, marginTop: 10 }}
          titleStyle={{ color: theme.colors.primary }}
        />
      </Overlay>
    </View>
  );
};

export default ControlButtons;