// NetworkLogsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { useTheme, Icon, Button, Overlay } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

const NetworkLogsScreen = ({ route }) => {
  const { theme } = useTheme();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isRecording, setIsRecording] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cookiesOverlayVisible, setCookiesOverlayVisible] = useState(false);
  const [localStorageOverlayVisible, setLocalStorageOverlayVisible] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (route.params?.log && isRecording) {
      addLog(route.params.log);
    }
  }, [route.params?.log]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery]);

  const loadLogs = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem('@networkLogs');
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const addLog = async (log) => {
    const updatedLogs = [log, ...logs].slice(0, 100);  // Keep last 100 logs
    setLogs(updatedLogs);
    try {
      await AsyncStorage.setItem('@networkLogs', JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Error saving logs:', error);
    }
  };

  const clearLogs = async () => {
    setLogs([]);
    setFilteredLogs([]);
    try {
      await AsyncStorage.removeItem('@networkLogs');
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    // You might want to show a toast or some feedback here
  };

  const filterLogs = () => {
    if (searchQuery) {
      const filtered = logs.filter(log => 
        log.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.status.toString().includes(searchQuery)
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(logs);
    }
  };

  const renderLogItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.logItem, { backgroundColor: theme.colors.background }]}
      onPress={() => {
        setSelectedLog(item);
        setModalVisible(true);
      }}
    >
      <Text style={[styles.logText, { color: theme.colors.text }]}>
        {item.method} {item.url}
      </Text>
      <Text style={[styles.logText, { color: theme.colors.grey3 }]}>
        Status: {item.status}, Duration: {item.duration}ms
      </Text>
    </TouchableOpacity>
  );

  const renderLogDetails = () => {
    if (!selectedLog) return null;

    const renderSection = (title, content, contentType = 'text') => (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={() => copyToClipboard(JSON.stringify(content, null, 2))}>
            <Icon name="content-copy" type="material" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        {contentType === 'json' ? (
          <Text style={[styles.detailText, { color: theme.colors.text }]}>{JSON.stringify(content, null, 2)}</Text>
        ) : (
          <Text style={[styles.detailText, { color: theme.colors.text }]}>{content}</Text>
        )}
      </View>
    );

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Log Details</Text>
          <ScrollView style={styles.modalContent}>
            {renderSection('URL', selectedLog.url)}
            {renderSection('Method', selectedLog.method)}
            {renderSection('Status', selectedLog.status)}
            {renderSection('Duration', `${selectedLog.duration}ms`)}
            {renderSection('Request Headers', selectedLog.requestHeaders, 'json')}
            {renderSection('Request Body', selectedLog.requestBody || 'N/A')}
            {renderSection('Response Headers', selectedLog.responseHeaders, 'json')}
            {renderSection('Response Body', selectedLog.responseBody || 'N/A')}
            {renderSection('Cookies in Header', selectedLog.cookiesInHeader || 'N/A')}
          </ScrollView>
          <Button
            title="Copy All"
            onPress={() => copyToClipboard(JSON.stringify(selectedLog, null, 2))}
            buttonStyle={{ backgroundColor: theme.colors.primary }}
            containerStyle={styles.modalButton}
          />
          <Button
            title="Close"
            onPress={() => setModalVisible(false)}
            buttonStyle={{ backgroundColor: theme.colors.grey3 }}
            containerStyle={styles.modalButton}
          />
        </View>
      </Modal>
    );
  };

  const renderCookiesOverlay = () => (
    <Overlay
      isVisible={cookiesOverlayVisible}
      onBackdropPress={() => setCookiesOverlayVisible(false)}
      overlayStyle={[styles.overlay, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.overlayTitle, { color: theme.colors.text }]}>Cookies</Text>
      <ScrollView>
        <Text style={[styles.overlayText, { color: theme.colors.text }]}>{logs[0]?.cookies || 'No cookies'}</Text>
      </ScrollView>
      <Button
        title="Copy"
        onPress={() => copyToClipboard(logs[0]?.cookies || '')}
        buttonStyle={{ backgroundColor: theme.colors.primary }}
        containerStyle={styles.overlayButton}
      />
      <Button
        title="Close"
        onPress={() => setCookiesOverlayVisible(false)}
        buttonStyle={{ backgroundColor: theme.colors.grey3 }}
        containerStyle={styles.overlayButton}
      />
    </Overlay>
  );

  const renderLocalStorageOverlay = () => (
    <Overlay
      isVisible={localStorageOverlayVisible}
      onBackdropPress={() => setLocalStorageOverlayVisible(false)}
      overlayStyle={[styles.overlay, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.overlayTitle, { color: theme.colors.text }]}>Local Storage</Text>
      <ScrollView>
        <Text style={[styles.overlayText, { color: theme.colors.text }]}>{logs[0]?.localStorage || 'No local storage data'}</Text>
      </ScrollView>
      <Button
        title="Copy"
        onPress={() => copyToClipboard(logs[0]?.localStorage || '')}
        buttonStyle={{ backgroundColor: theme.colors.primary }}
        containerStyle={styles.overlayButton}
      />
      <Button
        title="Close"
        onPress={() => setLocalStorageOverlayVisible(false)}
        buttonStyle={{ backgroundColor: theme.colors.grey3 }}
        containerStyle={styles.overlayButton}
      />
    </Overlay>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Button
          title={isRecording ? "Pause" : "Resume"}
          onPress={toggleRecording}
          icon={<Icon name={isRecording ? "pause" : "play"} color="white" />}
          buttonStyle={{ backgroundColor: isRecording ? theme.colors.warning : theme.colors.success }}
        />
        <Button
          title="Clear Logs"
          onPress={clearLogs}
          icon={<Icon name="trash" type="font-awesome" color="white" />}
          buttonStyle={{ backgroundColor: theme.colors.error }}
        />
        <Button
          title="Cookies"
          onPress={() => setCookiesOverlayVisible(true)}
          buttonStyle={{ backgroundColor: theme.colors.primary }}
        />
        <Button
          title="Local Storage"
          onPress={() => setLocalStorageOverlayVisible(true)}
          buttonStyle={{ backgroundColor: theme.colors.primary }}
        />
      </View>
      <TextInput
        style={[styles.searchInput, { color: theme.colors.text, backgroundColor: theme.colors.grey5 }]}
        placeholder="Search logs..."
        placeholderTextColor={theme.colors.grey3}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredLogs}
        renderItem={renderLogItem}
        keyExtractor={(item, index) => index.toString()}
      />
      {renderLogDetails()}
      {renderCookiesOverlay()}
      {renderLocalStorageOverlay()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  searchInput: {
    height: 40,
    margin: 10,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  logItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  logText: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    marginTop: 22,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalContent: {
    flex: 1,
  },
  section: {
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailText: {
    fontSize: 14,
  },
  modalButton: {
    marginTop: 10,
  },
  overlay: {
    width: '90%',
    maxHeight: '80%',
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  overlayText: {
    fontSize: 14,
  },
  overlayButton: {
    marginTop: 10,
  },
});

export default NetworkLogsScreen;