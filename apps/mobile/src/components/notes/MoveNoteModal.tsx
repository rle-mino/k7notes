import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TouchableOpacity,
} from 'react-native';

interface MoveNoteModalProps {
  visible: boolean;
  noteId: string;
  currentFolderId: string | null;
  onClose: () => void;
  onMoved: () => void;
}

/**
 * Move note modal - placeholder for online-first implementation.
 *
 * TODO: Connect to server API for:
 * - GET /api/folders (list all folders)
 * - PUT /api/notes/:id (move note to folder)
 */
export function MoveNoteModal({
  visible,
  noteId,
  currentFolderId,
  onClose,
  onMoved,
}: MoveNoteModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Move to folder</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.placeholder}>
            <Text style={styles.message}>
              Online-first implementation pending.
            </Text>
            <Text style={styles.hint}>
              Connect to server API to move notes.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  placeholder: {
    padding: 40,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
