import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/styles";

type Props = {
    connectedId: string;
    connectedName: string | null;
    onDisconnect: () => void;
};

export function ConnectedBox({
    connectedId,
    connectedName,
    onDisconnect,
}: Props) {
    return (
        <View style={styles.connectedBox}>
            <Text style={styles.connectedTitle}>Connected</Text>
            <Text style={styles.connectedText}>
                {connectedName ?? "Unnamed"}
            </Text>
            <Text style={styles.connectedMeta}>id: {connectedId}</Text>

            <TouchableOpacity
                style={[styles.button, styles.buttonStop]}
                onPress={onDisconnect}
                activeOpacity={0.8}
            >
                <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
        </View>
    );
}
