import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileComponent = ({ isVisible, onClose }) => {
  const { theme } = useTheme();
  const [profileData, setProfileData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Fetch the Clerk session
      const clerkResponse = await fetch('https://clerk.suno.com/v1/client?_clerk_js_version=4.73.8');
      const clerkData = await clerkResponse.json();
      
      // Extract and store the session ID
      const sessionId = clerkData.response.sessions[0].id;
      await AsyncStorage.setItem('sessionId', sessionId);
      
      console.info("Session ID:", sessionId);

      // Step 2: Use the session ID to fetch user data
      const touchResponse = await fetch(`https://clerk.suno.com/v1/client/sessions/${sessionId}/touch?_clerk_js_version=5.26.1`, {
        method: 'POST',
      });
      const touchData = await touchResponse.json();
      
      // Extract user data from the touch response
      const userData = touchData.response.user;
      setProfileData(userData);

      // Store JWT
      const jwt = touchData.response.last_active_token.jwt;
      await AsyncStorage.setItem('jwt', jwt);

      console.info("Fetched user data:", JSON.stringify(userData, null, 2));
      console.info("JWT:", jwt);

    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to fetch profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      fetchProfileData();
    }
  }, [isVisible, fetchProfileData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileData().then(() => setRefreshing(false));
  }, [fetchProfileData]);

  if (!isVisible) return null;

  const renderInfoItem = (icon, label, value) => (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={24} color={theme.colors.primary} style={styles.infoIcon} />
      <View>
        <Text style={[styles.infoLabel, { color: theme.colors.grey3 }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{value}</Text>
      </View>
    </View>
  );

  const renderLinkedAccount = (account) => (
    <View key={account.id} style={styles.linkedAccount}>
      <Ionicons
        name={account.provider === 'oauth_microsoft' ? 'logo-microsoft' : 'logo-google'}
        size={24}
        color={theme.colors.primary}
        style={styles.linkedAccountIcon}
      />
      <View>
        <Text style={[styles.linkedAccountProvider, { color: theme.colors.text }]}>
          {account.provider === 'oauth_microsoft' ? 'Microsoft' : 'Google'}
        </Text>
        <Text style={[styles.linkedAccountEmail, { color: theme.colors.grey3 }]}>
          {account.email_address}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: theme.colors.background }]}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
              <TouchableOpacity onPress={fetchProfileData} style={styles.retryButton}>
                <Text style={[styles.retryText, { color: theme.colors.primary }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {profileData && (
                <>
                  <View style={styles.header}>
                    <Image
                      source={{ uri: profileData.image_url }}
                      style={styles.profileImage}
                    />
                    <View style={styles.nameContainer}>
                      <Text style={[styles.name, { color: theme.colors.text }]}>
                        {profileData.first_name} {profileData.last_name}
                      </Text>
                      <Text style={[styles.email, { color: theme.colors.grey3 }]}>
                        {profileData.email_addresses[0].email_address}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoSection}>
                    {renderInfoItem('person-outline', 'Username', profileData.username || 'Not set')}
                    {renderInfoItem('call-outline', 'Phone', profileData.phone_numbers[0]?.phone_number || 'Not set')}
                    {renderInfoItem('shield-outline', 'Two-Factor Auth', profileData.two_factor_enabled ? 'Enabled' : 'Disabled')}
                    {renderInfoItem('time-outline', 'Last Sign In', new Date(profileData.last_sign_in_at).toLocaleString())}
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Linked Accounts</Text>
                    {profileData.external_accounts.map(renderLinkedAccount)}
                  </View>
                </>
              )}
            </ScrollView>
          )}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
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
  scrollView: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
  },
  infoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  linkedAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  linkedAccountIcon: {
    marginRight: 15,
  },
  linkedAccountProvider: {
    fontSize: 16,
    fontWeight: '500',
  },
  linkedAccountEmail: {
    fontSize: 14,
  },
  closeButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    padding: 10,
  },
  retryText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileComponent;