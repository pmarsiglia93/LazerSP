import "./src/i18n";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import { LocationProvider } from "./src/context/LocationContext";
import { VisitsProvider } from "./src/context/VisitsContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <LocationProvider>
      <FavoritesProvider>
        <VisitsProvider>
          <AppNavigator />
        </VisitsProvider>
      </FavoritesProvider>
    </LocationProvider>
  );
}
