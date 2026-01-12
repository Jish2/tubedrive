interface CreatePlaylistButtonProps {
  onClick: () => void;
}

export default function CreatePlaylistButton({
  onClick,
}: CreatePlaylistButtonProps) {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-square bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer border-2 border-transparent hover:border-gray-500 transition-all flex flex-col items-center justify-center p-4"
    >
      <div className="relative w-16 h-16 mb-2">
        <svg
          className="w-16 h-16 text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        {/* Plus icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
      </div>
      <span className="text-sm text-center text-gray-200 truncate w-full px-2">
        Create Playlist
      </span>
    </div>
  );
}
