import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // hide bottom bar
      }}
    >
      <Tabs.Screen name="home" />
    </Tabs>
  );
}
