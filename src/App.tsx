import { useAuth } from "./contexts/AuthContext";
import FolderView from "./components/FolderView";
import Login from "./components/Login";
import UserMenu from "./components/UserMenu";

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">TubeDrive</h1>
          <UserMenu />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <FolderView />
      </div>
    </div>
  );
}

export default App;
