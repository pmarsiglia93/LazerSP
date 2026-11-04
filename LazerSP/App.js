import "./src/i18n";
import { AuthProvider } from "./src/context/AuthContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import { LocationProvider } from "./src/context/LocationContext";
import { VisitsProvider } from "./src/context/VisitsContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <FavoritesProvider>
          <VisitsProvider>
            <AppNavigator />
          </VisitsProvider>
        </FavoritesProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
