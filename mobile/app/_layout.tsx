import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* Landing page TANPA header */}
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      {/* Login */}
      <Stack.Screen
        name="login"
        options={{ headerShown: true }}
      />

      {/* Tabs */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
