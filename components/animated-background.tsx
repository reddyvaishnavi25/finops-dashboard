'use client'

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base gradient background - charcoal to midnight indigo */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #0d0a2a 50%, #0f0a1a 100%)',
        }}
      />

      {/* Network grid overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-5"
        style={{
          background: 'url("data:image/svg+xml,%3Csvg width="50" height="50" xmlns="http://www.w3.org/2000/svg"%3E%3Cg stroke="%23888" stroke-width="0.5" fill="none"%3E%3Cpath d="M0 0h50M0 0v50"/%3E%3C/g%3E%3C/svg%3E)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating data particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: `hsl(${260 + i * 5}, 70%, 50%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `drift-slow ${8 + i * 0.5}s infinite`,
              animationDelay: `${i * 0.3}s`,
              boxShadow: `0 0 10px hsl(${260 + i * 5}, 70%, 50%)`,
            }}
          />
        ))}
      </div>

      {/* Soft glow regions */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
    </div>
  )
}
