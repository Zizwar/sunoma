import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, StyleSheet, Switch, Alert, TextInput, TouchableOpacity, Modal, Linking } from 'react-native';
import { Text, Button, Icon, Divider, Overlay } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../utils/ThemeContext';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [settings, setSettings] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentSetting, setCurrentSetting] = useState(null);
  const [newName, setNewName] = useState('');
  const [newSess, setNewSess] = useState('');
  const [newCookie, setNewCookie] = useState('');
  const [languageOverlayVisible, setLanguageOverlayVisible] = useState(false);

  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
        i18n.changeLanguage(savedLanguage);
      }
      const notificationSetting = await AsyncStorage.getItem('notifications');
      setNotifications(notificationSetting === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const changeLanguage = async (lang) => {
    try {
      await AsyncStorage.setItem('userLanguage', lang);
      i18n.changeLanguage(lang);
      setCurrentLanguage(lang);
      setLanguageOverlayVisible(false);
      Alert.alert(t('languageChanged'), t('languageChangedMessage'));
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const toggleNotifications = async (value) => {
  setNotifications(value);
  try {
    await AsyncStorage.setItem('notificationsEnabled', value.toString());
  } catch (error) {
    console.error('Error saving notification setting:', error);
  }
};

  const addOrUpdateSetting = () => {
  if (!newName.trim() || !newSess.trim() || !newCookie.trim()) {
    Alert.alert(
      t('error'),
      t('allFieldsRequired'),
      [{ text: t('ok'), onPress: () => console.log('OK Pressed') }]
    );
    return;
  }

  if (currentSetting) {
    const updatedSettings = settings.map(setting => 
      setting.id === currentSetting.id 
        ? {...setting, name: newName.trim(), sess: newSess.trim(), cookie: newCookie.trim()} 
        : setting
    );
    saveSettings(updatedSettings);
  } else {
    const newSetting = {
      id: Date.now().toString(),
      name: newName.trim(),
      sess: newSess.trim(),
      cookie: newCookie.trim(),
      isActive: settings.length === 0
    };
    saveSettings([...settings, newSetting]);
  }
  setModalVisible(false);
  clearForm();
};

const handleSave = () => {
  addOrUpdateSetting();
};


  const deleteSetting = (id) => {
    const updatedSettings = settings.filter(setting => setting.id !== id);
    saveSettings(updatedSettings);
  };

  const toggleActive = (id) => {
    const updatedSettings = settings.map(setting => ({
      ...setting,
      isActive: setting.id === id
    }));
    saveSettings(updatedSettings);
  };

  const clearForm = () => {
    setNewName('');
    setNewSess('');
    setNewCookie('');
    setCurrentSetting(null);
  };

  const openModal = (setting = null) => {
    if (setting) {
      setCurrentSetting(setting);
      setNewName(setting.name);
      setNewSess(setting.sess);
      setNewCookie(setting.cookie);
    } else {
      clearForm();
    }
    setModalVisible(true);
  };

  const clearAllData = async () => {
    Alert.alert(
      t('warning'),
      t('clearDataWarning'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('clear'),
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setSettings([]);
              setCurrentLanguage('en');
              setNotifications(false);
              i18n.changeLanguage('en');
              Alert.alert(t('success'), t('dataCleared'));
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert(t('error'), t('dataClearFailed'));
            }
          }
        }
      ]
    );
  };

  const privacyPolicy = `
    1. Data Collection: We collect user data including Google account information, usage statistics, and user-generated content.

    2. Third-Party Services: We use third-party services, including suno.com, for AI-generated content. Their privacy policies may also apply.

    3. Cookies: We use cookies to enhance user experience and maintain connections.

    4. Audio Storage: Users can store audio files locally on their devices for offline use.

    5. Microphone Access: We request microphone access for certain app functions.

    6. Data Security: We implement security measures to protect user data, but cannot guarantee absolute security.

    7. Data Sharing: We do not sell user data. We may share anonymized data for analytics purposes.

    8. User Rights: Users can request access, correction, or deletion of their personal data.

    9. Changes to Policy: We may update this policy and will notify users of significant changes.

    10. Contact: For privacy concerns, contact [Your Contact Information].
  `;

  const termsOfService = `
    1. Acceptance: By using the app, you agree to these terms.

    2. User Account: You are responsible for maintaining the confidentiality of your account.

    3. Content Usage: AI-generated content is for personal use only. Respect copyright and intellectual property rights.

    4. Prohibited Activities: Do not use the app for illegal activities or to violate others' rights.

    5. Service Availability: We strive for continuous service but do not guarantee uninterrupted access.

    6. Third-Party Services: We are not responsible for third-party services integrated into the app.

    7. Liability Limitation: We are not liable for any damages arising from app use.

    8. Modifications: We may modify the app or these terms at any time.

    9. Termination: We reserve the right to terminate accounts for violations of these terms.

    10. Governing Law: These terms are governed by [Your Jurisdiction] law.
  `;

  const SettingItem = ({ icon, title, description, action }) => (
    <TouchableOpacity style={styles.settingItem} onPress={action}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{title}</Text>
        {description && <Text style={[styles.settingDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>{description}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
    </TouchableOpacity>
  );



  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#ffffff' }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t('appSettings')}</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Ionicons name="moon" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          </View>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t('darkMode')}</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Ionicons name="notifications" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          </View>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t('notifications')}</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={notifications ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>
        <SettingItem
          icon="language"
          title={t('language')}
          description={t(currentLanguage)}
          action={() => setLanguageOverlayVisible(true)}
        />
      </View>

      <Divider style={[styles.divider, { backgroundColor: isDarkMode ? '#ffffff' : '#000000' }]} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t('dataAndStorage')}</Text>
        <SettingItem
          icon="trash"
          title={t('clearAllData')}
          action={clearAllData}
        />
      </View>

      <Divider style={[styles.divider, { backgroundColor: isDarkMode ? '#ffffff' : '#000000' }]} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t('cookieManagement')}</Text>
        {settings.map((setting) => (
          <View key={setting.id} style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="key" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{setting.name}</Text>
              <Text style={[styles.settingDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>{setting.isActive ? t('active') : t('inactive')}</Text>
            </View>
            <View style={styles.settingActions}>
              <TouchableOpacity onPress={() => toggleActive(setting.id)}>
                <Ionicons name={setting.isActive ? "radio-button-on" : "radio-button-off"} size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openModal(setting)}>
                <Ionicons name="create" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteSetting(setting.id)}>
                <Ionicons name="trash" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <Button
          title={t('addNewSetting')}
          onPress={() => openModal()}
          icon={<Icon name="add" size={20} color="white" />}
          buttonStyle={[styles.addButton, { backgroundColor: isDarkMode ? '#bb86fc' : '#2089dc' }]}
        />
      </View>

      <Divider style={[styles.divider, { backgroundColor: isDarkMode ? '#ffffff' : '#000000' }]} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t('legal')}</Text>
        <SettingItem
          icon="document-text"
          title={t('privacyPolicy')}
          action={() => setPrivacyModalVisible(true)}
        />
        <SettingItem
          icon="document-text"
          title={t('termsOfService')}
          action={() => setTermsModalVisible(true)}
        />
      </View>

      <Overlay
        isVisible={privacyModalVisible}
        onBackdropPress={() => setPrivacyModalVisible(false)}
        overlayStyle={[styles.modal, { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }]}
      >
        <ScrollView>
          <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t('privacyPolicy')}</Text>
          <Text style={[styles.modalText, { color: isDarkMode ? '#cccccc' : '#333333' }]}>{privacyPolicy}</Text>
        </ScrollView>
        <TouchableOpacity onPress={() => setPrivacyModalVisible(false)} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t('close')}</Text>
        </TouchableOpacity>
      </Overlay>

      <Overlay
        isVisible={termsModalVisible}
        onBackdropPress={() => setTermsModalVisible(false)}
        overlayStyle={[styles.modal, { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }]}
      >
        <ScrollView>
          <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t('termsOfService')}</Text>
          <Text style={[styles.modalText, { color: isDarkMode ? '#cccccc' : '#333333' }]}>{termsOfService}</Text>
        </ScrollView>
        <TouchableOpacity onPress={() => setTermsModalVisible(false)} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t('close')}</Text>
        </TouchableOpacity>
      </Overlay>
    
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              {currentSetting ? t('editSetting') : t('addNewSetting')}
            </Text>
            <TextInput
              style={[styles.input, { color: isDarkMode ? '#ffffff' : '#000000', backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f0f0' }]}
              placeholder={t('name')}
              placeholderTextColor={isDarkMode ? '#cccccc' : '#666666'}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={[styles.input, { color: isDarkMode ? '#ffffff' : '#000000', backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f0f0' }]}
              placeholder="Sess"
              placeholderTextColor={isDarkMode ? '#cccccc' : '#666666'}
              value={newSess}
              onChangeText={setNewSess}
            />
            <TextInput
              style={[styles.input, { color: isDarkMode ? '#ffffff' : '#000000', backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f0f0' }]}
              placeholder="Cookie"
              placeholderTextColor={isDarkMode ? '#cccccc' : '#666666'}
              value={newCookie}
              onChangeText={setNewCookie}
            />
            <View style={styles.modalButtons}>
   <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
  <Ionicons name="checkmark" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
</TouchableOpacity>

              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.iconButton}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Overlay
        isVisible={languageOverlayVisible}
        onBackdropPress={() => setLanguageOverlayVisible(false)}
        overlayStyle={[styles.languageOverlay, { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }]}
      >
        <Text style={[styles.overlayTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t('selectLanguage')}</Text>
        {['en', 'ar', 'fr', 'amz'].map((lang) => (
          <TouchableOpacity
            key={lang}
            style={styles.languageOption}
            onPress={() => changeLanguage(lang)}
          >
            <Text style={[styles.languageText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{t(lang)}</Text>
          </TouchableOpacity>
        ))}
      </Overlay>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  settingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 100,
  },
  divider: {
    marginVertical: 16,
  },
  addButton: {
    marginTop: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  iconButton: {
    padding: 10,
  },
  languageOverlay: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  languageText: {
    fontSize: 16,
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;