import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

/**
 * Folder screen - placeholder for online-first implementation.
 *
 * TODO: Connect to server API for:
 * - GET /api/folders/:id (get folder)
 * - GET /api/folders/:id/contents (get folder contents)
 * - POST /api/notes (create note in folder)
 * - POST /api/folders (create subfolder)
 */
export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: 'Folder' }} />
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.title}>Folder</Text>
          <Text style={styles.folderId}>ID: {id}</Text>
          <Text style={styles.message}>
            Online-first implementation pending.
          </Text>
          <Text style={styles.hint}>
            Connect to server API to display folder contents.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  folderId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#999',
    marginBottom: 16,
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
