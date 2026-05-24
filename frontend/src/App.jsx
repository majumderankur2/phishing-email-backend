import AppRoutes from "./routes/AppRoutes";
import Scan from "./pages/Scan";
<Route path="/scan" element={<Scan />} />
function App() {

  return <AppRoutes />;
}

export default App;