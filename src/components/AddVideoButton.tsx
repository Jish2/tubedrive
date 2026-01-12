interface AddVideoButtonProps {
  onClick: () => void;
}

export default function AddVideoButton({ onClick }: AddVideoButtonProps) {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-square bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer border-2 border-transparent hover:border-gray-500 transition-all flex flex-col items-center justify-center p-4"
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
        Add Video
      </span>
    </div>
  );
}
