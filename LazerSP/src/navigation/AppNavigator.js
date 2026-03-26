import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform } from "react-native";

import DetailsScreen from "../screens/DetailsScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import SplashScreen from "../screens/SplashScreen";
import theme from "../styles/theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Explorar: { focused: "compass", outline: "compass-outline" },
  Favoritos: { focused: "heart", outline: "heart-outline" },
  Mapa: { focused: "map", outline: "map-outline" },
};

const TAB_SCREEN_OPTIONS = {
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.white,
  headerTitleStyle: { fontWeight: "bold" },
  tabBarActiveTintColor: theme.colors.primary,
  tabBarInactiveTintColor: theme.colors.textLight,
  tabBarStyle: {
    backgroundColor: theme.colors.white,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 85 : 65,
    paddingBottom: Platform.OS === "ios" ? 25 : 10,
    paddingTop: 8,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: "600",
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...TAB_SCREEN_OPTIONS,
        tabBarIcon: ({ focused, color, size }) => {
          const icon = TAB_ICONS[route.name];
          return (
            <Ionicons
              name={focused ? icon.focused : icon.outline}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Explorar"
        component={HomeScreen}
        options={{ title: "LazerSP", tabBarLabel: "Explorar" }}
      />
      <Tab.Screen
        name="Favoritos"
        component={FavoritesScreen}
        options={{ title: "Favoritos", tabBarLabel: "Favoritos" }}
      />
      <Tab.Screen
        name="Mapa"
        component={MapScreen}
        options={{
          title: "Mapa",
          tabBarLabel: "Mapa",
          tabBarButton: Platform.OS === "web" ? () => null : undefined,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.white,
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{ title: "Detalhes" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
