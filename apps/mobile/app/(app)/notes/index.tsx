import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

/**
 * Notes index screen - placeholder for online-first implementation.
 *
 * TODO: Connect to server API for:
 * - GET /api/notes (list notes)
 * - GET /api/folders (list folders)
 * - POST /api/notes (create note)
 * - POST /api/folders (create folder)
 */
export default function NotesIndexScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.title}>Notes</Text>
        <Text style={styles.message}>
          Online-first implementation pending.
        </Text>
        <Text style={styles.hint}>
          Connect to server API to display notes.
        </Text>
      </View>
    </View>
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
