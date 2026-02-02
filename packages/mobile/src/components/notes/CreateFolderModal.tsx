import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ORPCError } from "@orpc/client";
import { orpc } from "@/lib/orpc";

type ValidationIssue = { message: string; path?: (string | number)[] };

/**
 * Extract a user-friendly error message from an API error
 */
function getErrorMessage(err: unknown): string {
  if (err instanceof ORPCError) {
    // Check for validation errors in the data field (sent over the wire)
    const data = err.data as { issues?: ValidationIssue[] } | undefined;
    if (data?.issues && Array.isArray(data.issues) && data.issues.length > 0) {
      return data.issues
        .map((issue) => {
          const path = issue.path?.join(".") || "";
          return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join("\n");
    }
    // Use the oRPC error message
    return err.message || `Error: ${err.code}`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "Failed to create folder";
}

interface CreateFolderModalProps {
  visible: boolean;
  parentFolderId: string | null;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateFolderModal({
  visible,
  parentFolderId,
  onClose,
  onCreated,
}: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setName("");
      setError(null);
    }
  }, [visible]);

  const handleCreate = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a folder name");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await orpc.folders.create({
        name: trimmedName,
        parentId: parentFolderId,
      });
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ORPCError) {
        console.error("Failed to create folder (ORPCError):", {
          code: err.code,
          status: err.status,
          message: err.message,
          data: err.data,
          defined: err.defined,
        });
      } else {
        console.error("Failed to create folder:", err);
      }
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }, [name, parentFolderId, onCreated, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.title}>New Folder</Text>

          <TextInput
            style={styles.input}
            placeholder="Folder name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            maxLength={100}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={creating}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreate}
              disabled={creating || !name.trim()}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1a1a1a",
    backgroundColor: "#f9f9f9",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 8,
  },
  buttons: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  createButton: {
    backgroundColor: "#007AFF",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
