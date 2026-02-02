import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Calendar, Trash2, ChevronRight } from "lucide-react-native";
import type { CalendarConnection } from "@/lib/orpc";

interface CalendarConnectionItemProps {
  connection: CalendarConnection;
  onDisconnect: (connectionId: string) => Promise<void>;
  onPress?: (connection: CalendarConnection) => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  google: "#4285F4",
  microsoft: "#0078D4",
};

const PROVIDER_NAMES: Record<string, string> = {
  google: "Google Calendar",
  microsoft: "Microsoft Outlook",
};

export function CalendarConnectionItem({
  connection,
  onDisconnect,
  onPress,
}: CalendarConnectionItemProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  const providerColor = PROVIDER_COLORS[connection.provider] || "#666";
  const providerName = PROVIDER_NAMES[connection.provider] || connection.provider;

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Calendar",
      `Are you sure you want to disconnect ${connection.accountEmail}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              setDisconnecting(true);
              await onDisconnect(connection.id);
            } catch (err) {
              console.error("Failed to disconnect:", err);
              Alert.alert("Error", "Failed to disconnect calendar");
            } finally {
              setDisconnecting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.content}
        onPress={() => onPress?.(connection)}
        disabled={!onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: providerColor }]}>
          <Calendar size={20} color="#fff" />
        </View>
        <View style={styles.info}>
          <Text style={styles.providerName}>{providerName}</Text>
          <Text style={styles.email} numberOfLines={1}>
            {connection.accountEmail}
          </Text>
          {connection.accountName && (
            <Text style={styles.name} numberOfLines={1}>
              {connection.accountName}
            </Text>
          )}
        </View>
        {onPress && <ChevronRight size={20} color="#999" />}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.disconnectButton}
        onPress={handleDisconnect}
        disabled={disconnecting}
      >
        {disconnecting ? (
          <ActivityIndicator size="small" color="#FF3B30" />
        ) : (
          <Trash2 size={18} color="#FF3B30" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  email: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  name: {
    fontSize: 12,
    color: "#999",
    marginTop: 1,
  },
  disconnectButton: {
    padding: 8,
    marginLeft: 8,
  },
});
