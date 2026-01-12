import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import {BleManager, Device, State} from 'react-native-ble-plx';

type ScannedDevice = {
  id: string;
  name: string;
  rssi?: number | null;
};

export default function App() {
  const manager = useMemo(() => new BleManager(), []);
  const [bleState, setBleState] = useState<State | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<ScannedDevice[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [connectedName, setConnectedName] = useState<string | null>(null);

  useEffect(() => {
    const sub = manager.onStateChange((state) => {
      setBleState(state);
    }, true);

    return () => {
      sub.remove();
      manager.destroy();
    };
  }, [manager]);

  const upsertDevice = (d: Device) => {
    const id = d.id;
    const name = (d.name ?? d.localName ?? 'Unnamed').trim();
    const rssi = d.rssi;

    setDevices((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {id, name, rssi};
        return copy;
      }
      return [{id, name, rssi}, ...prev];
    });
  };

  const stopScan = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  // ✅ Your scan logic (filtered by name includes "nimble")
  const startScan = async () => {
    setDevices([]);
    seenIdsRef.current = new Set();
    setIsScanning(true);

    // Scan everything, then filter by name in JS
    manager.startDeviceScan(null, {allowDuplicates: false}, (error, device) => {
      if (error) {
        console.log('Scan error:', error);
        stopScan();
        return;
      }
      if (!device) return;

      const name = (device.name ?? device.localName ?? '').trim();
      if (!name.toLowerCase().includes('nimble')) return;

      // Dedup (optional but nice)
      if (!seenIdsRef.current.has(device.id)) {
        seenIdsRef.current.add(device.id);
      }

      upsertDevice(device);
    });
  };

  const toggleScan = async () => {
    if (isScanning) {
      stopScan();
      return;
    }
    if (bleState !== State.PoweredOn) {
      console.log('Bluetooth not powered on:', bleState);
      return;
    }
    await startScan();
  };

  // ✅ Tap a scanned device to connect (“pair”)
  const connectToScannedDevice = async (deviceId: string) => {
    try {
      stopScan();
      setConnectingId(deviceId);

      const device = await manager.connectToDevice(deviceId, {autoConnect: false});
      await device.discoverAllServicesAndCharacteristics();

      setConnectedId(device.id);
      setConnectedName((device.name ?? device.localName ?? 'Unnamed').trim());

      console.log('Connected to:', device.id, device.name ?? device.localName);
    } catch (e) {
      console.log('Connect error:', e);
      setConnectedId(null);
      setConnectedName(null);
    } finally {
      setConnectingId(null);
    }
  };

  const disconnect = async () => {
    if (!connectedId) return;
    try {
      await manager.cancelDeviceConnection(connectedId);
    } catch (e) {
      console.log('Disconnect error:', e);
    } finally {
      setConnectedId(null);
      setConnectedName(null);
    }
  };

  const statusText = (() => {
    if (!bleState) return 'Checking Bluetooth state...';
    if (bleState === State.PoweredOn) return 'Bluetooth: ON';
    return `Bluetooth: ${bleState}`;
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>StupidWatch BLE Scanner (iOS)</Text>
        <Text style={styles.subtitle}>{statusText}</Text>

        {connectedId ? (
          <View style={styles.connectedBox}>
            <Text style={styles.connectedTitle}>Connected</Text>
            <Text style={styles.connectedText}>
              {connectedName ?? 'Unnamed'}
            </Text>
            <Text style={styles.connectedMeta}>id: {connectedId}</Text>

            <TouchableOpacity
              style={[styles.button, styles.buttonStop]}
              onPress={disconnect}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.button,
              isScanning ? styles.buttonStop : styles.buttonStart,
            ]}
            onPress={toggleScan}
            activeOpacity={0.8}
            disabled={!!connectingId}
          >
            <Text style={styles.buttonText}>
              {isScanning ? 'Stop Scanning' : 'Start Scanning'}
            </Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({item}) => {
            const isConnecting = connectingId === item.id;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => connectToScannedDevice(item.id)}
                disabled={!!connectingId || !!connectedId}
                activeOpacity={0.8}
              >
                <Text style={styles.deviceName}>
                  {item.name}{' '}
                  {isConnecting ? (
                    <Text style={styles.badge}> (connecting…)</Text>
                  ) : null}
                </Text>
                <Text style={styles.deviceMeta}>id: {item.id}</Text>
                <Text style={styles.deviceMeta}>rssi: {item.rssi ?? 'N/A'}</Text>
                <Text style={styles.tapHint}>Tap to connect</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {isScanning ? 'Scanning...' : 'Tap Start Scanning.'}
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#0b0b0f'},
  container: {flex: 1, padding: 16},
  title: {color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 6},
  subtitle: {color: '#c9c9d1', marginBottom: 14},

  button: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonStart: {backgroundColor: '#2b6ef2'},
  buttonStop: {backgroundColor: '#e24a4a'},
  buttonText: {color: 'white', fontSize: 16, fontWeight: '700'},

  connectedBox: {
    backgroundColor: '#151521',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  connectedTitle: {color: 'white', fontSize: 14, fontWeight: '700'},
  connectedText: {color: 'white', fontSize: 16, fontWeight: '700', marginTop: 4},
  connectedMeta: {color: '#b8b8c6', marginTop: 2},

  sectionTitle: {color: 'white', fontSize: 14, marginBottom: 8},
  list: {paddingBottom: 24},
  card: {
    backgroundColor: '#151521',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  deviceName: {color: 'white', fontSize: 16, fontWeight: '700'},
  deviceMeta: {color: '#b8b8c6', marginTop: 2},
  tapHint: {color: '#7f86ff', marginTop: 8, fontWeight: '600'},
  empty: {color: '#b8b8c6', marginTop: 10},
  badge: {color: '#ffd37a', fontWeight: '700'},
});
