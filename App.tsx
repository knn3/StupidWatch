import React from "react";
import {
    FlatList,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useBleScanner } from "./src/ble/useBleScanner";
import { ConnectedBox } from "./src/components/ConnectedBox";
import { DeviceCard } from "./src/components/DeviceCard";
import { styles } from "./src/styles/styles";

export default function App() {
    const {
        statusText,
        isScanning,
        devices,
        connectingId,
        connectedId,
        connectedName,
        toggleScan,
        connectToScannedDevice,
        disconnect,
    } = useBleScanner({ nameIncludes: "nimble" });

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>StupidWatch BLE Scanner (iOS)</Text>
                <Text style={styles.subtitle}>{statusText}</Text>

                {connectedId ? (
                    <ConnectedBox
                        connectedId={connectedId}
                        connectedName={connectedName}
                        onDisconnect={disconnect}
                    />
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
                            {isScanning ? "Stop Scanning" : "Start Scanning"}
                        </Text>
                    </TouchableOpacity>
                )}

                <FlatList
                    data={devices}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <DeviceCard
                            item={item}
                            isConnecting={connectingId === item.id}
                            disabled={!!connectingId || !!connectedId}
                            onPress={() => connectToScannedDevice(item.id)}
                        />
                    )}
                    ListEmptyComponent={
                        <Text style={styles.empty}>
                            {isScanning ? "Scanning..." : "Tap Start Scanning."}
                        </Text>
                    }
                />
            </View>
        </SafeAreaView>
    );
}
