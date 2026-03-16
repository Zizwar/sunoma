import React, { useRef, useState, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text, Modal,
  FlatList, ScrollView, TextInput, SafeAreaView, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme, Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const SUNO_HOME = 'https://suno.com';
const NOTIF_URL = 'https://studio-api.prod.suno.com/api/notification/v2';

// ── colour palette ────────────────────────────────────────────────────────────
const C = {
  bg:       '#0d1117',
  surface:  '#161b22',
  border:   '#30363d',
  text:     '#c9d1d9',
  muted:    '#8b949e',
  green:    '#3fb950',
  red:      '#f85149',
  blue:     '#58a6ff',
  yellow:   '#d29922',
  purple:   '#bc8cff',
};

// ── DevTools Modal ────────────────────────────────────────────────────────────
const DevToolsModal = ({ visible, onClose, logs, setLogs, bearerToken, touchUrl, onTestConnection, notifCount }) => {
  const [selectedLog, setSelectedLog] = useState(null);
  const [logDetailVisible, setLogDetailVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search
    ? logs.filter(l => l.url?.toLowerCase().includes(search.toLowerCase()) || String(l.status).includes(search))
    : logs;

  const copyText = async (text) => { await Clipboard.setStringAsync(String(text)); };

  const deleteLog = (index) => {
    setLogs(prev => prev.filter((_, i) => i !== index));
  };

  const downloadLogs = async () => {
    try {
      const json = JSON.stringify(logs, null, 2);
      const path = FileSystem.documentDirectory + `suno_logs_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Save network logs' });
      } else {
        // Fallback: copy to clipboard
        await Clipboard.setStringAsync(json);
        Alert.alert('Copied', 'Logs copied to clipboard (sharing not available)');
      }
    } catch (e) {
      // Last resort: copy to clipboard
      try {
        await Clipboard.setStringAsync(JSON.stringify(logs, null, 2));
        Alert.alert('Copied', 'Logs copied to clipboard');
      } catch (_) {
        Alert.alert('Error', e.message);
      }
    }
  };

  const statusColor = (s) => {
    if (s >= 200 && s < 300) return C.green;
    if (s >= 400) return C.red;
    return C.yellow;
  };

  const methodColor = (m) => {
    if (m === 'POST') return C.purple;
    if (m === 'DELETE') return C.red;
    return C.blue;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.devtools}>

        {/* Header */}
        <View style={styles.dtHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.dtTitle}>DevTools</Text>
            {notifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{notifCount}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Test connection */}
            <TouchableOpacity onPress={onTestConnection} style={styles.dtIconBtn}>
              <Icon name="wifi-tethering" type="material" size={20} color={bearerToken ? C.green : C.muted} />
            </TouchableOpacity>
            {/* Download all */}
            <TouchableOpacity onPress={downloadLogs} style={styles.dtIconBtn} disabled={logs.length === 0}>
              <Icon name="download" type="material" size={20} color={logs.length ? C.blue : C.muted} />
            </TouchableOpacity>
            {/* Clear all */}
            <TouchableOpacity onPress={() => setLogs([])} style={styles.dtIconBtn} disabled={logs.length === 0}>
              <Icon name="delete-sweep" type="material" size={20} color={logs.length ? C.red : C.muted} />
            </TouchableOpacity>
            {/* Close */}
            <TouchableOpacity onPress={onClose} style={styles.dtIconBtn}>
              <Icon name="close" type="material" size={22} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bearer / Touch URL info */}
        {bearerToken ? (
          <TouchableOpacity style={styles.tokenBar} onPress={() => copyText(bearerToken)}>
            <View style={[styles.dot, { backgroundColor: C.green }]} />
            <Text style={[styles.tokenLabel, { color: C.green }]}>JWT </Text>
            <Text style={styles.tokenValue} numberOfLines={1}>{bearerToken.slice(0, 40)}…</Text>
            <Icon name="content-copy" type="material" size={14} color={C.muted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.tokenBar}>
            <View style={[styles.dot, { backgroundColor: C.red }]} />
            <Text style={[styles.tokenLabel, { color: C.red }]}>No JWT — login via browser</Text>
          </View>
        )}

        {touchUrl ? (
          <TouchableOpacity style={[styles.tokenBar, { backgroundColor: '#0d2110' }]} onPress={() => copyText(touchUrl)}>
            <Icon name="link" type="material" size={14} color={C.muted} style={{ marginRight: 6 }} />
            <Text style={[styles.tokenValue, { color: C.muted }]} numberOfLines={1}>{touchUrl}</Text>
            <Icon name="content-copy" type="material" size={14} color={C.muted} />
          </TouchableOpacity>
        ) : null}

        {/* Search */}
        <TextInput
          style={styles.dtSearch}
          placeholder="Filter URL / status…"
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
        />

        {/* Count */}
        <View style={{ paddingHorizontal: 12, paddingBottom: 4 }}>
          <Text style={{ color: C.muted, fontSize: 11 }}>{filtered.length} request{filtered.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Log list */}
        <FlatList
          data={filtered}
          keyExtractor={(_, i) => String(i)}
          ListEmptyComponent={
            <Text style={{ color: C.muted, textAlign: 'center', marginTop: 40 }}>No requests captured</Text>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.logRow}
              onPress={() => { setSelectedLog(item); setLogDetailVisible(true); }}
            >
              <Text style={[styles.logMethod, { color: methodColor(item.method) }]}>
                {(item.method ?? 'GET').slice(0, 4)}
              </Text>
              <Text style={styles.logUrl} numberOfLines={1}>{item.url}</Text>
              <Text style={[styles.logStatus, { color: statusColor(item.status) }]}>{item.status}</Text>
              <Text style={styles.logDuration}>{item.duration}ms</Text>
              <TouchableOpacity onPress={() => deleteLog(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="delete" type="material" size={16} color={C.red} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />

        {/* Log Detail Modal */}
        <Modal visible={logDetailVisible} animationType="slide" transparent={false} onRequestClose={() => setLogDetailVisible(false)}>
          <SafeAreaView style={styles.devtools}>
            <View style={styles.dtHeader}>
              <Text style={styles.dtTitle}>Request Detail</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => copyText(JSON.stringify(selectedLog, null, 2))} style={styles.dtIconBtn}>
                  <Icon name="content-copy" type="material" size={20} color={C.blue} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setLogDetailVisible(false)} style={styles.dtIconBtn}>
                  <Icon name="close" type="material" size={22} color={C.text} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={{ flex: 1, padding: 14 }}>
              {selectedLog && Object.entries(selectedLog).map(([key, val]) => (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailKey}>{key}</Text>
                  <Text style={styles.detailVal}>
                    {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? '')}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

      </SafeAreaView>
    </Modal>
  );
};

// ── CentralScreen ─────────────────────────────────────────────────────────────
const CentralScreen = () => {
  const webViewRef = useRef(null);
  const [navState, setNavState] = useState({ canGoBack: false, canGoForward: false, url: SUNO_HOME });
  const [logs, setLogs] = useState([]);
  const [bearerToken, setBearerToken] = useState('');
  const [touchUrl, setTouchUrl] = useState('');
  const [devToolsVisible, setDevToolsVisible] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const injectedJavaScript = `
    (function() {
      if (window.__rn_intercepted) return true;
      window.__rn_intercepted = true;

      function tryExtractSession(urlStr, bodyStr) {
        try {
          if (!urlStr.includes('/sessions/session_')) return;
          var parsed = JSON.parse(bodyStr);
          var resp = parsed.response;
          if (!resp) return;
          var jwt = resp.last_active_token && resp.last_active_token.jwt;
          var sessionId = resp.id;
          if (jwt && sessionId) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'sessionTouch',
              jwt: jwt,
              sessionId: sessionId,
              touchUrl: urlStr,
              user: resp.user || null,
            }));
          }
        } catch(e) {}
      }

      var _fetch = window.fetch;
      window.fetch = function(url, opts) {
        var t0 = Date.now();
        var hdrs = (opts && opts.headers) || {};
        var urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        return _fetch.apply(this, arguments).then(function(res) {
          res.clone().text().then(function(body) {
            tryExtractSession(urlStr, body);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'networkLog',
              url: urlStr,
              method: (opts && opts.method) || 'GET',
              status: res.status,
              duration: Date.now() - t0,
              responseBody: body.slice(0, 1500),
            }));
          });
          return res;
        });
      };

      var _XHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        var xhr = new _XHR();
        var _url = '';
        var _open = xhr.open.bind(xhr);
        xhr.open = function(method, url) { _url = url || ''; return _open.apply(xhr, arguments); };
        xhr.addEventListener('load', function() {
          try { tryExtractSession(_url, xhr.responseText); } catch(e) {}
        });
        return xhr;
      };
    })();
    true;
  `;

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'sessionTouch') {
        setBearerToken(data.jwt);
        setTouchUrl(data.touchUrl ?? '');
        AsyncStorage.setItem('@bearer', data.jwt).catch(() => {});
        AsyncStorage.setItem('@jwt', data.jwt).catch(() => {});
        AsyncStorage.setItem('@sessionId', data.sessionId).catch(() => {});
        AsyncStorage.setItem('@touchUrl', data.touchUrl ?? '').catch(() => {});
        if (data.user) {
          AsyncStorage.setItem('profileImage', data.user.image_url ?? '').catch(() => {});
          const name = `${data.user.first_name ?? ''} ${data.user.last_name ?? ''}`.trim();
          AsyncStorage.setItem('profileName', name).catch(() => {});
        }
      } else if (data.type === 'networkLog') {
        setLogs(prev => [data, ...prev].slice(0, 300));
      }
    } catch (_) {}
  }, []);

  const testConnection = useCallback(async () => {
    if (!bearerToken) {
      Alert.alert('No JWT', 'Login via the browser first');
      return;
    }
    try {
      const res = await fetch(NOTIF_URL, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/json',
        }
      });
      const json = await res.json();
      const notifs = json.notifications ?? [];
      const unread = notifs.filter(n => !n.is_read).length;
      setNotifCount(notifs.length);
      Alert.alert(
        res.ok ? '✅ Connected' : '❌ Failed',
        `Status: ${res.status}\nNotifications: ${notifs.length} (${unread} unread)`
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }, [bearerToken]);

  const goBack    = () => webViewRef.current?.goBack();
  const goForward = () => webViewRef.current?.goForward();
  const reload    = () => webViewRef.current?.reload();
  const goHome    = () => webViewRef.current?.injectJavaScript(`window.location.href='${SUNO_HOME}';true;`);

  const activeColor = (on) => on ? '#fff' : '#444';

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <WebView
        ref={webViewRef}
        source={{ uri: SUNO_HOME }}
        style={{ flex: 1 }}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        onNavigationStateChange={setNavState}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
      />

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.tbBtn} onPress={goBack} disabled={!navState.canGoBack}>
          <Icon name="arrow-back" type="material" size={22} color={activeColor(navState.canGoBack)} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tbBtn} onPress={goForward} disabled={!navState.canGoForward}>
          <Icon name="arrow-forward" type="material" size={22} color={activeColor(navState.canGoForward)} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tbBtn} onPress={reload}>
          <Icon name="refresh" type="material" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tbBtn} onPress={goHome}>
          <Icon name="home" type="material" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.urlBar}>
          {/* ● Green dot when JWT ready */}
          <View style={[styles.dot, { backgroundColor: bearerToken ? C.green : '#555', marginRight: 6 }]} />
          <Text style={styles.urlText} numberOfLines={1}>{navState.url}</Text>
        </View>

        {/* DevTools toggle */}
        <TouchableOpacity style={styles.tbBtn} onPress={() => setDevToolsVisible(true)}>
          <View>
            <Icon name="developer-mode" type="material" size={22} color={logs.length ? C.blue : '#555'} />
            {logs.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{logs.length > 99 ? '99+' : logs.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <DevToolsModal
        visible={devToolsVisible}
        onClose={() => setDevToolsVisible(false)}
        logs={logs}
        setLogs={setLogs}
        bearerToken={bearerToken}
        touchUrl={touchUrl}
        onTestConnection={testConnection}
        notifCount={notifCount}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 4,
    backgroundColor: '#161b22',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  tbBtn: { width: 42, alignItems: 'center', justifyContent: 'center' },
  urlBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginHorizontal: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  urlText: { color: C.muted, fontSize: 11, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: C.red, borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  // DevTools
  devtools: { flex: 1, backgroundColor: C.bg },
  dtHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  dtTitle: { fontSize: 16, fontWeight: 'bold', color: C.text },
  dtIconBtn: { padding: 4 },
  tokenBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0d2a0d',
    paddingHorizontal: 12, paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  tokenLabel: { fontSize: 11, fontWeight: 'bold' },
  tokenValue: { color: C.muted, fontSize: 11, flex: 1 },
  dtSearch: {
    margin: 10, borderWidth: 1, borderRadius: 8,
    borderColor: C.border, paddingHorizontal: 12, height: 38,
    fontSize: 13, color: C.text, backgroundColor: C.surface,
  },
  logRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    gap: 6,
  },
  logMethod: { width: 36, fontSize: 10, fontWeight: 'bold' },
  logUrl: { flex: 1, color: C.text, fontSize: 11 },
  logStatus: { width: 34, fontSize: 11, textAlign: 'right', fontWeight: 'bold' },
  logDuration: { width: 46, color: C.muted, fontSize: 10, textAlign: 'right' },

  detailRow: { marginBottom: 14 },
  detailKey: { color: C.blue, fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
  detailVal: { color: C.text, fontSize: 12, fontFamily: 'monospace' },

  notifBadge: {
    backgroundColor: C.red, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});

export default CentralScreen;
