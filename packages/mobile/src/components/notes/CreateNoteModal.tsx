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
import { router } from "expo-router";
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

  return "Failed to create note";
}

interface CreateNoteModalProps {
  visible: boolean;
  folderId: string | null;
  onClose: () => void;
}

export function CreateNoteModal({
  visible,
  folderId,
  onClose,
}: CreateNoteModalProps) {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setTitle("");
      setError(null);
    }
  }, [visible]);

  const handleCreate = useCallback(async () => {
    const trimmedTitle = title.trim() || "Untitled";

    try {
      setCreating(true);
      setError(null);
      const newNote = await orpc.notes.create({
        title: trimmedTitle,
        content: "",
        folderId: folderId,
      });
      onClose();
      // Navigate to the edit screen for the new note
      router.push(`/notes/${newNote.id}`);
    } catch (err) {
      if (err instanceof ORPCError) {
        console.error("Failed to create note (ORPCError):", {
          code: err.code,
          status: err.status,
          message: err.message,
          data: err.data,
          defined: err.defined,
        });
      } else {
        console.error("Failed to create note:", err);
      }
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }, [title, folderId, onClose]);

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
          <Text style={styles.title}>New Note</Text>

          <TextInput
            style={styles.input}
            placeholder="Note title"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            maxLength={200}
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
              disabled={creating}
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
