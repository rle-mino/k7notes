import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLiveQuery, listAllFolders, moveNote, Folder } from '../../../db';

interface MoveNoteModalProps {
  visible: boolean;
  noteId: string;
  currentFolderId: string | null;
  onClose: () => void;
  onMoved: () => void;
}

export function MoveNoteModal({
  visible,
  noteId,
  currentFolderId,
  onClose,
  onMoved,
}: MoveNoteModalProps) {
  const { data: folders, loading } = useLiveQuery(() => listAllFolders(), []);
  const [moving, setMoving] = useState(false);

  const handleMove = async (folderId: string | null) => {
    if (folderId === currentFolderId) {
      onClose();
      return;
    }

    setMoving(true);
    try {
      await moveNote(noteId, folderId);
      onMoved();
      onClose();
    } catch (err) {
      console.error('Failed to move note:', err);
    } finally {
      setMoving(false);
    }
  };

  const renderFolder = ({ item }: { item: Folder | { id: null; name: string } }) => {
    const isCurrentFolder = item.id === currentFolderId;
    return (
      <TouchableOpacity
        style={[styles.folderItem, isCurrentFolder && styles.folderItemCurrent]}
        onPress={() => handleMove(item.id)}
        disabled={moving}
      >
        <Text style={styles.folderIcon}>{item.id === null ? 'home' : 'folder'}</Text>
        <Text style={[styles.folderName, isCurrentFolder && styles.folderNameCurrent]}>
          {item.name}
        </Text>
        {isCurrentFolder && <Text style={styles.currentBadge}>Current</Text>}
      </TouchableOpacity>
    );
  };

  // Add "Root" option at the beginning
  const allOptions: Array<Folder | { id: null; name: string }> = [
    { id: null, name: 'Notes (Root)' },
    ...(folders ?? []),
  ];

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

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              data={allOptions}
              keyExtractor={(item) => item.id ?? 'root'}
              renderItem={renderFolder}
              contentContainerStyle={styles.list}
            />
          )}

          {moving && (
            <View style={styles.movingOverlay}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.movingText}>Moving...</Text>
            </View>
          )}
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
  loading: {
    padding: 40,
    alignItems: 'center',
  },
  list: {
    paddingVertical: 8,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  folderItemCurrent: {
    backgroundColor: '#f8f8f8',
  },
  folderIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  folderName: {
    fontSize: 16,
    flex: 1,
  },
  folderNameCurrent: {
    color: '#666',
  },
  currentBadge: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  movingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  movingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 16,
  },
});
