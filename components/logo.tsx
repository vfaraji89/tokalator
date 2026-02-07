'use client';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`group flex items-center gap-2 ${className}`}>
      {/* Abacus Icon with hover effects */}
      <div className="relative transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-[-3deg]">
        <svg
          width="36"
          height="36"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
        >
          <style>
            {`
              /* Entrance animations */
              @keyframes frameEnter {
                0% { opacity: 0; transform: scale(0.8); }
                100% { opacity: 1; transform: scale(1); }
              }
              @keyframes beadEnter {
                0% { opacity: 0; transform: scale(0.5); }
                100% { opacity: 1; transform: scale(1); }
              }

              /* Idle bead sliding animations */
              @keyframes slideRow1 {
                0%, 20% { transform: translateX(0); }
                25%, 45% { transform: translateX(4px); }
                50%, 100% { transform: translateX(0); }
              }
              @keyframes slideRow2 {
                0%, 35% { transform: translateX(0); }
                40%, 60% { transform: translateX(-3px); }
                65%, 100% { transform: translateX(0); }
              }
              @keyframes slideRow3 {
                0%, 50% { transform: translateX(0); }
                55%, 75% { transform: translateX(5px); }
                80%, 100% { transform: translateX(0); }
              }

              .abacus-frame {
                animation: frameEnter 0.4s ease-out forwards;
              }
              .bead {
                animation: beadEnter 0.3s ease-out forwards;
              }
              .bead-row-1 {
                animation: beadEnter 0.3s ease-out forwards, slideRow1 4s ease-in-out 0.5s infinite;
              }
              .bead-row-2 {
                animation: beadEnter 0.3s ease-out 0.1s forwards, slideRow2 4s ease-in-out 0.5s infinite;
              }
              .bead-row-3 {
                animation: beadEnter 0.3s ease-out 0.2s forwards, slideRow3 4s ease-in-out 0.5s infinite;
              }

              /* Hover state - faster animations */
              .logo-svg:hover .bead-row-1 {
                animation: beadEnter 0.3s ease-out forwards, slideRow1 1.5s ease-in-out infinite;
              }
              .logo-svg:hover .bead-row-2 {
                animation: beadEnter 0.3s ease-out 0.1s forwards, slideRow2 1.5s ease-in-out infinite;
              }
              .logo-svg:hover .bead-row-3 {
                animation: beadEnter 0.3s ease-out 0.2s forwards, slideRow3 1.5s ease-in-out infinite;
              }
            `}
          </style>

          {/* Frame */}
          <g className="abacus-frame">
            {/* Outer frame */}
            <path
              d="M4 4 L4 24 L24 24 L24 4 Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
              className="text-gray-800"
            />
            {/* Rods */}
            <line x1="4" y1="9" x2="24" y2="9" stroke="currentColor" strokeWidth="1.2" className="text-gray-800"/>
            <line x1="4" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1.2" className="text-gray-800"/>
            <line x1="4" y1="19" x2="24" y2="19" stroke="currentColor" strokeWidth="1.2" className="text-gray-800"/>
          </g>

          {/* Row 1 beads */}
          <g className="bead-row-1">
            <circle cx="8" cy="9" r="2.2" fill="#e3120b"/>
            <circle cx="13" cy="9" r="2.2" className="fill-gray-800"/>
          </g>

          {/* Row 2 beads */}
          <g className="bead-row-2">
            <circle cx="9" cy="14" r="2.2" className="fill-gray-800"/>
            <circle cx="14" cy="14" r="2.2" fill="#e3120b"/>
            <circle cx="19" cy="14" r="2.2" fill="#e3120b"/>
          </g>

          {/* Row 3 beads */}
          <g className="bead-row-3">
            <circle cx="8" cy="19" r="2.2" fill="#e3120b"/>
            <circle cx="13" cy="19" r="2.2" fill="#e3120b"/>
            <circle cx="18" cy="19" r="2.2" className="fill-gray-800"/>
          </g>
        </svg>
      </div>

      {/* Text with motion animation */}
      <span className="text-motion font-bold text-xl text-gray-900 transition-all duration-300">
        @Tokalator
      </span>
    </div>
  );
}
