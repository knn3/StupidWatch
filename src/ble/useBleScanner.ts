import { useEffect, useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, State } from "react-native-ble-plx";

export type ScannedDevice = {
    id: string;
    name: string;
    rssi?: number | null;
};

type Options = {
    nameIncludes?: string; // default "nimble"
};

export function useBleScanner(options: Options = {}) {
    const manager = useMemo(() => new BleManager(), []);
    const [bleState, setBleState] = useState<State | null>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [devices, setDevices] = useState<ScannedDevice[]>([]);

    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [connectedId, setConnectedId] = useState<string | null>(null);
    const [connectedName, setConnectedName] = useState<string | null>(null);

    const nameFilter = (options.nameIncludes ?? "nimble").toLowerCase();

    useEffect(() => {
        const sub = manager.onStateChange((state) => setBleState(state), true);
        return () => {
            sub.remove();
            manager.destroy();
        };
    }, [manager]);

    const requestAndroidPermissions = async () => {
        if (Platform.OS !== "android") return true;

        // Android 12+ (API 31+)
        if (Platform.Version >= 31) {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ]);

            return (
                granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
                    PermissionsAndroid.RESULTS.GRANTED
            );
        }

        // Android <12
        const loc = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        return loc === PermissionsAndroid.RESULTS.GRANTED;
    };

    const upsertDevice = (d: Device) => {
        const id = d.id;
        const name = (d.name ?? d.localName ?? "Unnamed").trim();
        const rssi = d.rssi;

        setDevices((prev) => {
            const idx = prev.findIndex((x) => x.id === id);
            if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = { id, name, rssi };
                return copy;
            }
            return [{ id, name, rssi }, ...prev];
        });
    };

    const stopScan = () => {
        if (!isScanning) return;
        manager.stopDeviceScan();
        setIsScanning(false);
    };

    const startScan = () => {
        setDevices([]);
        setIsScanning(true);

        manager.startDeviceScan(
            null,
            { allowDuplicates: false },
            (error, device) => {
                if (error) {
                    console.log("Scan error:", error);
                    stopScan();
                    return;
                }
                if (!device) return;

                const name = (device.name ?? device.localName ?? "")
                    .trim()
                    .toLowerCase();
                if (!name.includes(nameFilter)) return;

                upsertDevice(device);
            }
        );
    };

    const toggleScan = async () => {
        if (isScanning) {
            stopScan();
            return;
        }

        if (Platform.OS === "android") {
            const ok = await requestAndroidPermissions();
            if (!ok) {
                console.log("Bluetooth permissions not granted");
                return;
            }
        }

        if (bleState !== State.PoweredOn) {
            console.log("Bluetooth not powered on:", bleState);
            return;
        }

        startScan();
    };

    const connectToScannedDevice = async (deviceId: string) => {
        try {
            stopScan();
            setConnectingId(deviceId);

            const device = await manager.connectToDevice(deviceId, {
                autoConnect: false,
            });
            await device.discoverAllServicesAndCharacteristics();

            setConnectedId(device.id);
            setConnectedName(
                (device.name ?? device.localName ?? "Unnamed").trim()
            );
        } catch (e) {
            console.log("Connect error:", e);
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
            console.log("Disconnect error:", e);
        } finally {
            setConnectedId(null);
            setConnectedName(null);
        }
    };

    const statusText = !bleState
        ? "Checking Bluetooth state..."
        : bleState === State.PoweredOn
        ? "Bluetooth: ON"
        : `Bluetooth: ${bleState}`;

    return {
        statusText,
        isScanning,
        devices,
        connectingId,
        connectedId,
        connectedName,
        toggleScan,
        connectToScannedDevice,
        disconnect,
    };
}
