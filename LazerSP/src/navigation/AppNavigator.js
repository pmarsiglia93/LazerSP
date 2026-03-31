import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

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

const LANGUAGES = [
  { code: "pt", flag: "🇧🇷" },
  { code: "en", flag: "🇬🇧" },
  { code: "es", flag: "🇪🇸" },
];

function LanguageButton() {
  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];
  const nextIndex = (LANGUAGES.indexOf(current) + 1) % LANGUAGES.length;

  return (
    <TouchableOpacity
      onPress={() => i18n.changeLanguage(LANGUAGES[nextIndex].code)}
      style={{ marginRight: 16, padding: 4 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="globe-outline" size={22} color={theme.colors.white} />
    </TouchableOpacity>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const tabBarStyle = {
    backgroundColor: theme.colors.white,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    height: (Platform.OS === "ios" ? 60 : 56) + insets.bottom,
    paddingBottom: insets.bottom + (Platform.OS === "ios" ? 8 : 6),
    paddingTop: 8,
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.white,
        headerTitleStyle: { fontWeight: "bold" },
        headerRight: () => <LanguageButton />,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarStyle,
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
        options={{ title: t("nav.app_title"), tabBarLabel: t("nav.explore") }}
      />
      <Tab.Screen
        name="Favoritos"
        component={FavoritesScreen}
        options={{ title: t("nav.favorites"), tabBarLabel: t("nav.favorites") }}
      />
      <Tab.Screen
        name="Mapa"
        component={MapScreen}
        options={{
          title: t("nav.map"),
          tabBarLabel: t("nav.map"),
          tabBarButton: Platform.OS === "web" ? () => null : undefined,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { t } = useTranslation();

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
          options={{ title: t("nav.details") }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
