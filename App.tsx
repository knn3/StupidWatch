import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
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
    const name = d.name ?? d.localName ?? 'Unnamed';
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

  const startScan = async () => {
    setDevices([]);
    seenIdsRef.current = new Set();
    setIsScanning(true);

    // Start scanning (no service UUID filter for “scan everything”)
    manager.startDeviceScan(null, {allowDuplicates: false}, (error, device) => {
      if (error) {
        console.log('Scan error:', error);
        stopScan();
        return;
      }
      if (!device) return;

      const name = device.name ?? device.localName ?? '';

      if (!name.toLowerCase().includes('nimble')) return;

      upsertDevice(device);
    });
  };

  const stopScan = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  const toggleScan = async () => {
    if (isScanning) {
      stopScan();
      return;
    }

    // iOS will prompt for Bluetooth permission when needed.
    // Only start scanning when Bluetooth is powered on.
    if (bleState !== State.PoweredOn) {
      console.log('Bluetooth not powered on:', bleState);
      return;
    }

    await startScan();
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
        <Text style={styles.subtitle}>
          {statusText} {Platform.OS === 'ios' ? '(iOS)' : ''}
        </Text>

        <TouchableOpacity
          style={[styles.button, isScanning ? styles.buttonStop : styles.buttonStart]}
          onPress={toggleScan}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Discovered devices: {devices.length}
        </Text>

        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({item}) => (
            <View style={styles.card}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceMeta}>id: {item.id}</Text>
              <Text style={styles.deviceMeta}>rssi: {item.rssi ?? 'N/A'}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {isScanning ? 'Scanning...' : 'No devices yet. Tap Start Scanning.'}
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
  empty: {color: '#b8b8c6', marginTop: 10},
});
