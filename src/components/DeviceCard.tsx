import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { ScannedDevice } from "../ble/useBleScanner";
import { styles } from "../styles/styles";

type Props = {
    item: ScannedDevice;
    isConnecting: boolean;
    disabled: boolean;
    onPress: () => void;
};

export function DeviceCard({ item, isConnecting, disabled, onPress }: Props) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            <Text style={styles.deviceName}>
                {item.name}
                {isConnecting ? (
                    <Text style={styles.badge}> (connecting…)</Text>
                ) : null}
            </Text>

            <Text style={styles.deviceMeta}>id: {item.id}</Text>
            <Text style={styles.deviceMeta}>rssi: {item.rssi ?? "N/A"}</Text>

            <Text style={styles.tapHint}>Tap to connect</Text>
        </TouchableOpacity>
    );
}
