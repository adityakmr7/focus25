import {createStaticNavigation} from "@react-navigation/native";
import {AppStackNavigation} from "./src/navigations";
import './global.css';
const Navigation = createStaticNavigation(AppStackNavigation);

const AppContent = () => {
    return (
            <Navigation/>
    );
};

export default function App() {
    return <AppContent />;
}

