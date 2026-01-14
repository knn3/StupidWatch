import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0b0b0f" },
    container: { flex: 1, padding: 16 },
    title: { color: "white", fontSize: 20, fontWeight: "700", marginBottom: 6 },
    subtitle: { color: "#c9c9d1", marginBottom: 14 },

    button: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 16,
    },
    buttonStart: { backgroundColor: "#2b6ef2" },
    buttonStop: { backgroundColor: "#e24a4a" },
    buttonText: { color: "white", fontSize: 16, fontWeight: "700" },

    connectedBox: {
        backgroundColor: "#151521",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    connectedTitle: { color: "white", fontSize: 14, fontWeight: "700" },
    connectedText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
        marginTop: 4,
    },
    connectedMeta: { color: "#b8b8c6", marginTop: 2 },

    list: { paddingBottom: 24 },
    card: {
        backgroundColor: "#151521",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    deviceName: { color: "white", fontSize: 16, fontWeight: "700" },
    deviceMeta: { color: "#b8b8c6", marginTop: 2 },
    tapHint: { color: "#7f86ff", marginTop: 8, fontWeight: "600" },
    empty: { color: "#b8b8c6", marginTop: 10 },
    badge: { color: "#ffd37a", fontWeight: "700" },
});
