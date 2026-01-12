interface ImportPlaylistButtonProps {
  onClick: () => void;
}

export default function ImportPlaylistButton({
  onClick,
}: ImportPlaylistButtonProps) {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-square bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer border-2 border-transparent hover:border-gray-500 transition-all flex flex-col items-center justify-center p-4"
    >
      <div className="relative w-16 h-16 mb-2">
        <svg
          className="w-16 h-16 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>
      <span className="text-sm text-center text-gray-200 truncate w-full px-2">
        Import Playlist
      </span>
    </div>
  );
}
