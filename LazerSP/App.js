import { FavoritesProvider } from "./src/context/FavoritesContext";
import { LocationProvider } from "./src/context/LocationContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <LocationProvider>
      <FavoritesProvider>
        <AppNavigator />
      </FavoritesProvider>
    </LocationProvider>
  );
}
