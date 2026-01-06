<template>
  <svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    style="filter: drop-shadow(0px 8px 12px rgba(30, 64, 175, 0.5))">
    <defs>
      <linearGradient
        id="frontCardGradient"
        x1="0"
        y1="0"
        x2="1"
        y2="1">
        <stop
          offset="0%"
          stop-color="#93c5fd" />
        {/* blue-300 */}
        <stop
          offset="100%"
          stop-color="#3b82f6" />
        {/* blue-500 */}
      </linearGradient>
    </defs>

    {/* Back Card */}
    <rect
      x="8"
      y="16"
      width="36"
      height="44"
      rx="5"
      transform="rotate(-12 26 38)"
      class="fill-blue-900 stroke-blue-800/40"
      stroke-width="1" />

    {/* Middle Card */}
    <rect
      x="12"
      y="12"
      width="36"
      height="44"
      rx="5"
      transform="rotate(-6 30 34)"
      class="fill-blue-700 stroke-blue-600/40"
      stroke-width="1" />

    {/* Front Card */}
    <rect
      x="16"
      y="8"
      width="36"
      height="44"
      rx="5"
      fill="url(#frontCardGradient)"
      class="stroke-white/30"
      stroke-width="1" />

    {/* Sheen effect on front card */}
    <path
      d="M16 13C16 10.2386 18.2386 8 21 8H51C53.7614 8 56 10.2386 56 13V28L16 12V13Z"
      fill="white"
      fill-opacity="0.2" />
  </svg>
</template>
