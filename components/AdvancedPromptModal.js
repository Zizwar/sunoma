import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { Text, Button, Icon, Overlay } from 'react-native-elements';

// Import local data (as before)
import emotionsData from '../data/emotions.json';
import genresData from '../data/genres.json';
import periodsData from '../data/periods.json';
import productionsData from '../data/productions.json';
import regionsData from '../data/regions.json';
import vocalsData from '../data/vocals.json';
import extrasData from '../data/extras.json';
import commandsData from '../data/commands.json';

const categories = [
  { name: 'Cmd', data: commandsData, icon: 'code', color: '#FFA500' },
  { name: 'Emotions', data: emotionsData, icon: 'mood', color: '#FFD700' },
  { name: 'Genres', data: genresData, icon: 'music-note', color: '#4169E1' },
  { name: 'Periods', data: periodsData, icon: 'access-time', color: '#32CD32' },
  { name: 'Prod', data: productionsData, icon: 'equalizer', color: '#FF4500' },
  { name: 'Regions', data: regionsData, icon: 'public', color: '#8A2BE2' },
  { name: 'Vocals', data: vocalsData, icon: 'mic', color: '#FF1493' },
  { name: 'Extras', data: extrasData, icon: 'stars', color: '#20B2AA' },
];

const AdvancedPromptModal = ({ visible, onClose, prompt, onUpdatePrompt }) => {
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [description, setDescription] = useState('A minimal music ai Mo...');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLocalPrompt(prompt);
  }, [prompt]);

  const handlePromptChange = useCallback((text) => {
    setLocalPrompt(text);
    onUpdatePrompt(text);
  }, [onUpdatePrompt]);

  const handleCategoryPress = useCallback((category) => {
    setSelectedCategory(category);
    setOptionsVisible(true);
    setSearchQuery(''); // Reset search query when opening a new category
  }, []);

  const handleItemSelect = useCallback((item) => {
    let newText;
    if (typeof item === 'string') {
      newText = `[${item}]\n`;
    } else if (item.value) {
      newText = `${item.value}\n`;
    }
    
    if (newText) {
      const updatedPrompt = localPrompt.slice(0, cursorPosition) + newText + localPrompt.slice(cursorPosition);
      handlePromptChange(updatedPrompt);
      setCursorPosition(cursorPosition + newText.length);
    }
    
    setOptionsVisible(false);
  }, [localPrompt, cursorPosition, handlePromptChange]);

  const filteredData = useMemo(() => {
    if (!selectedCategory || !searchQuery) return selectedCategory?.data;
    return selectedCategory.data.filter(item => {
      const searchText = typeof item === 'string' ? item : item.text || item.value;
      return searchText.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [selectedCategory, searchQuery]);

  const renderCategoryButton = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.categoryButton}
      onPress={() => handleCategoryPress(item)}
    >
      <Icon
        name={item.icon}
        type="material"
        color={item.color}
        size={20}
        containerStyle={styles.categoryIcon}
      />
      <Text style={styles.categoryButtonText}>{item.name}</Text>
    </TouchableOpacity>
  ), [handleCategoryPress]);

  const renderCategoryItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.itemButton}
      onPress={() => handleItemSelect(item)}
    >
      <Icon
        name={selectedCategory.icon}
        type="material"
        color={selectedCategory.color}
        size={20}
        containerStyle={styles.itemIcon}
      />
      <Text style={styles.itemButtonText}>
        {typeof item === 'string' ? item : item.text}
      </Text>
    </TouchableOpacity>
  ), [handleItemSelect, selectedCategory]);

  const handleGenerate = () => {
    // Implement generation logic here
    console.log('Generating with prompt:', localPrompt);
    onClose();
  };

  return (
    <Overlay isVisible={visible} onBackdropPress={onClose} overlayStyle={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>T</Text>
          </View>
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description *</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" type="material" size={24} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.promptContainer}>
          <TextInput
            value={localPrompt}
            onChangeText={handlePromptChange}
            multiline
            placeholder="Enter your prompt here..."
            style={styles.promptInput}
            onSelectionChange={(event) => setCursorPosition(event.nativeEvent.selection.start)}
          />
        </ScrollView>
        <FlatList
          data={categories}
          renderItem={renderCategoryButton}
          keyExtractor={(item) => item.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
        />
        <View style={styles.footer}>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share" type="material" size={24} color="#888" />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
            <Text style={styles.generateText}>Generate</Text>
            <Icon name="arrow-forward" type="material" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <Overlay isVisible={optionsVisible} onBackdropPress={() => setOptionsVisible(false)} overlayStyle={styles.optionsOverlay}>
        <Text style={styles.optionsTitle}>{selectedCategory?.name}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <FlatList
          data={filteredData}
          renderItem={renderCategoryItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.optionsList}
        />
        <Button
          title="Back"
          onPress={() => setOptionsVisible(false)}
          buttonStyle={styles.backButton}
        />
      </Overlay>
    </Overlay>
  );
};

const styles = StyleSheet.create({
  overlay: {
    width: '90%',
    height: '80%',
    borderRadius: 20,
    padding: 0,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e6e6fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6a5acd',
  },
  descriptionContainer: {
    marginLeft: 10,
    flex: 1,
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#6a5acd',
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  promptContainer: {
    flex: 1,
    padding: 15,
  },
  promptInput: {
    fontSize: 16,
    textAlignVertical: 'top',
  },
  categoriesList: {
    maxHeight: 80,
    paddingHorizontal: 10,
  },
  categoryButton: {
    alignItems: 'center',
    marginHorizontal: 5,
    width: 60,
  },
  categoryIcon: {
    backgroundColor: 'transparent',
  },
  categoryButtonText: {
    marginTop: 5,
    fontSize: 10,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareText: {
    marginLeft: 5,
    color: '#888',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6a5acd',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  generateText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 5,
  },
  optionsOverlay: {
    width: '80%',
    height: '70%',
    padding: 20,
    borderRadius: 10,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsList: {
    flex: 1,
  },
  itemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemIcon: {
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  itemButtonText: {
    fontSize: 16,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#999',
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
});

export default AdvancedPromptModal;