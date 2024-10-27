import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { Icon } from 'react-native-elements';

const NotificationIcon = ({ onPress, unreadCount = 0 }) => (
  <TouchableOpacity style={styles.iconContainer} onPress={onPress}>
    <Icon name="notifications" type="material" size={24} color="#000" />
    {unreadCount > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{unreadCount}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const NotificationItem = ({ notification }) => {
  const { notification_type, user_profiles, created_at, react_content, is_read } = notification;
  
  const getNotificationContent = () => {
    const user = user_profiles[0];
    const userInfo = `${user.display_name} (${user.handle})`;
    
    switch (notification_type) {
      case 'follow':
        return {
          icon: 'person-add',
          message: `${userInfo} started following you`
        };
      case 'clip_like':
        return {
          icon: 'favorite',
          message: `${userInfo} liked your song "${react_content.title}"`
        };
      default:
        return {
          icon: 'notifications',
          message: 'New notification'
        };
    }
  };

  const content = getNotificationContent();
  const formattedDate = new Date(created_at).toLocaleString();

  return (
    <View style={[styles.notificationItem, !is_read && styles.unreadItem]}>
      {user_profiles[0].avatar_image_url && (
        <Image 
          source={{ uri: user_profiles[0].avatar_image_url }} 
          style={styles.avatar}
        />
      )}
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Icon name={content.icon} size={16} color="#1DB954" style={styles.icon} />
          <Text style={styles.timeText}>{formattedDate}</Text>
        </View>
        <Text style={styles.notificationText}>{content.message}</Text>
        {react_content?.image_url && (
          <Image 
            source={{ uri: react_content.image_url }} 
            style={styles.contentImage}
            resizeMode="cover"
          />
        )}
        {user_profiles[0].is_following !== undefined && (
          <View style={styles.followStatus}>
            <Icon 
              name={user_profiles[0].is_following ? 'people' : 'person-outline'} 
              size={16} 
              color="#666"
            />
            <Text style={styles.followStatusText}>
              {user_profiles[0].is_following ? 'Following' : 'Not Following'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const NotificationsModal = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dummy data for testing - replace with actual API call
  const dummyNotificationsData = {
    "notified_at": "2024-10-24T21:24:09.629Z",
    "notifications": [
      {
        "id": "1f038275-1be8-411b-a473-9f1a7d9dd950",
        "created_at": "2024-10-24T21:23:43.488Z",
        "is_read": false,
        "notification_type": "clip_like",
        "user_profiles": [{
          "display_name": "ZizWarez",
          "handle": "zizwarez",
          "avatar_image_url": "https://cdn1.suno.ai/68809b94.webp",
          "is_following": false
        }],
        "total_users": 1,
        "react_content": {
          "id": "27885492-7768-47e5-91c3-acb80359505d",
          "type": "clip",
          "title": "abbxfd gd azertyuiop qsdgghjk lmwxv cnn'zzzzzz",
          "image_url": "https://cdn2.suno.ai/image_27885492-7768-47e5-91c3-acb80359505d.jpeg"
        }
      },
      {
        "id": "9b1b13c2-eb3c-4181-bc0b-3a302eca65e5",
        "created_at": "2024-10-24T21:23:35.996Z",
        "is_read": false,
        "notification_type": "follow",
        "user_profiles": [{
          "display_name": "ZizWarez",
          "handle": "zizwarez",
          "avatar_image_url": "https://cdn1.suno.ai/68809b94.webp",
          "is_following": false
        }],
        "total_users": 1
      }
    ]
  };

  useEffect(() => {
    if (visible) {
      // Simulate API call
      setLoading(true);
      setTimeout(() => {
        setNotifications(dummyNotificationsData.notifications);
        setLoading(false);
      }, 500);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Notifications</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={notifications}
          renderItem={({ item }) => <NotificationItem notification={item} />}
          keyExtractor={item => item.id}
          refreshing={loading}
          onRefresh={() => {
            setLoading(true);
            setTimeout(() => {
              setNotifications(dummyNotificationsData.notifications);
              setLoading(false);
            }, 500);
          }}
          contentContainerStyle={styles.notificationsList}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No notifications</Text>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  notificationsList: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  unreadItem: {
    backgroundColor: '#f8f9fa',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  contentImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  followStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  followStatusText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
  },
});

export { NotificationIcon, NotificationsModal };