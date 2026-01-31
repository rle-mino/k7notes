import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import {
  useLiveQuery,
  getFolderContents,
  getFolder,
  getFolderPath,
  createNote,
  createFolder,
} from '../../../../db';
import { NoteCard, FolderCard, EmptyState } from '@/components/notes';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: contents, loading } = useLiveQuery(() => getFolderContents(id), [id]);
  const { data: folder } = useLiveQuery(() => getFolder(id), [id]);
  const { data: path } = useLiveQuery(() => getFolderPath(id), [id]);

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateNote = async () => {
    const note = await createNote({ title: 'Untitled', content: '', folderId: id });
    router.push(`/notes/${note.id}`);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder({ name: newFolderName.trim(), parentId: id });
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleNotePress = (noteId: string) => {
    router.push(`/notes/${noteId}`);
  };

  const handleFolderPress = (folderId: string) => {
    router.push(`/notes/folder/${folderId}`);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const isEmpty = !contents?.folders.length && !contents?.notes.length;

  return (
    <>
      <Stack.Screen options={{ title: folder?.name ?? 'Folder' }} />
      <View style={styles.container}>
        {/* Breadcrumb */}
        {path && path.length > 1 && (
          <View style={styles.breadcrumb}>
            <TouchableOpacity onPress={() => router.push('/notes')}>
              <Text style={styles.breadcrumbLink}>Notes</Text>
            </TouchableOpacity>
            {path.slice(0, -1).map((f) => (
              <React.Fragment key={f.id}>
                <Text style={styles.breadcrumbSep}>/</Text>
                <TouchableOpacity onPress={() => router.push(`/notes/folder/${f.id}`)}>
                  <Text style={styles.breadcrumbLink}>{f.name}</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        )}

        {isEmpty ? (
          <EmptyState
            title="Empty folder"
            message="Tap the + button to add a note or subfolder"
          />
        ) : (
          <FlatList
            data={[
              ...(contents?.folders.map((f) => ({ type: 'folder' as const, item: f })) ?? []),
              ...(contents?.notes.map((n) => ({ type: 'note' as const, item: n })) ?? []),
            ]}
            keyExtractor={(item) => item.item.id}
            renderItem={({ item }) =>
              item.type === 'folder' ? (
                <FolderCard
                  folder={item.item}
                  onPress={() => handleFolderPress(item.item.id)}
                />
              ) : (
                <NoteCard note={item.item} onPress={() => handleNotePress(item.item.id)} />
              )
            }
            contentContainerStyle={styles.list}
          />
        )}

        {/* FAB Menu */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, styles.fabSecondary]}
            onPress={() => setShowNewFolderModal(true)}
          >
            <Text style={styles.fabIcon}>📁</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fab} onPress={handleCreateNote}>
            <Text style={styles.fabIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* New Folder Modal */}
        <Modal visible={showNewFolderModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Folder</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Folder name"
                value={newFolderName}
                onChangeText={setNewFolderName}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowNewFolderModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleCreateFolder}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    Create
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  breadcrumbLink: {
    fontSize: 14,
    color: '#007AFF',
  },
  breadcrumbSep: {
    fontSize: 14,
    color: '#999',
    marginHorizontal: 6,
  },
  list: {
    paddingVertical: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabSecondary: {
    backgroundColor: '#34C759',
  },
  fabIcon: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontWeight: '600',
  },
});
