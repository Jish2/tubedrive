import { useAuth } from "../contexts/AuthContext";

export default function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <img
          src={user.picture}
          alt={user.name}
          className="w-8 h-8 rounded-full"
        />
        <span className="text-gray-300 hidden sm:block">{user.name}</span>
      </div>
      <button
        onClick={logout}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
      >
        Logout
      </button>
    </div>
  );
}
