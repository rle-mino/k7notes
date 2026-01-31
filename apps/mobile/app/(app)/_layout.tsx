import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Stack.Screen
        name="notes/index"
        options={{
          title: 'Notes',
        }}
      />
      <Stack.Screen
        name="notes/[id]"
        options={{
          title: 'Edit Note',
        }}
      />
      <Stack.Screen
        name="notes/folder/[id]"
        options={{
          title: 'Folder',
        }}
      />
      <Stack.Screen
        name="search/index"
        options={{
          title: 'Search',
        }}
      />
    </Stack>
  );
}
