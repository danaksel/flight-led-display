import svgPaths from "./svg-paths";

export function SkyframeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 244 29">
      <g clipPath="url(#skyframe-logo-clip)">
        <path d={svgPaths.p2d430b80} fill="currentColor" />
        <path d={svgPaths.p9531200} fill="currentColor" />
        <path d={svgPaths.p2c9e6780} fill="currentColor" />
        <path d={svgPaths.p9555180} fill="currentColor" />
        <path d={svgPaths.p36977b80} fill="currentColor" />
        <path d={svgPaths.p1d388ff0} fill="currentColor" />
        <path d={svgPaths.p127e7a80} fill="currentColor" />
        <path d={svgPaths.p372fbb00} fill="currentColor" />
      </g>
      <defs>
        <clipPath id="skyframe-logo-clip">
          <rect width="244" height="29" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 20 20">
      <path d={svgPaths.p1ba44f00} fill="currentColor" />
    </svg>
  );
}

export function IconDisplay({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 19 12">
      <g>
        <path d={svgPaths.pdcbd4c0} fill="currentColor" />
        <path d={svgPaths.p2086480} fill="currentColor" />
        <path d={svgPaths.p142a00} fill="currentColor" />
        <path d={svgPaths.p21d4e900} fill="currentColor" />
        <path d={svgPaths.p22147480} fill="currentColor" />
        <path d={svgPaths.pe4df000} fill="currentColor" />
        <path d={svgPaths.pc569080} fill="currentColor" />
        <path d={svgPaths.p17491b00} fill="currentColor" />
        <path d={svgPaths.p97dfe00} fill="currentColor" />
        <path d={svgPaths.pa968400} fill="currentColor" />
        <path d={svgPaths.p183ac400} fill="currentColor" />
        <path d={svgPaths.p16d2a780} fill="currentColor" />
        <path d={svgPaths.p2f04dd00} fill="currentColor" />
        <path d={svgPaths.p30c68300} fill="currentColor" />
        <path d={svgPaths.p45fd100} fill="currentColor" />
        <path d={svgPaths.pdb25dfa} fill="currentColor" />
        <path d={svgPaths.p1693e400} fill="currentColor" />
        <path d={svgPaths.pf69ee71} fill="currentColor" />
        <path d={svgPaths.p194ee480} fill="currentColor" />
        <path d={svgPaths.p3cc84c00} fill="currentColor" />
        <path d={svgPaths.p14cd7320} fill="currentColor" />
        <path d={svgPaths.p24c5db00} fill="currentColor" />
        <path d={svgPaths.p6544a00} fill="currentColor" />
        <path d={svgPaths.p252f7580} fill="currentColor" />
        <path d={svgPaths.p116ff00} fill="currentColor" />
        <path d={svgPaths.p93ab000} fill="currentColor" />
        <path d={svgPaths.p102b4a00} fill="currentColor" />
        <path d={svgPaths.pb9784b0} fill="currentColor" />
        <path d={svgPaths.p27d35a80} fill="currentColor" />
        <path d={svgPaths.pf2eb180} fill="currentColor" />
        <path d={svgPaths.p32374880} fill="currentColor" />
        <path d={svgPaths.p276224f0} fill="currentColor" />
        <path d={svgPaths.p39e75500} fill="currentColor" />
      </g>
    </svg>
  );
}

export function IconPlane({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 20 20">
      <path d={svgPaths.p3b14c580} fill="currentColor" />
    </svg>
  );
}

export function IconTimetable({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 20 20">
      <path d={svgPaths.p15c7ba00} fill="currentColor" />
    </svg>
  );
}

export function IconApi({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 20 20">
      <path
        d="M6.25 4.25L2.75 10L6.25 15.75M13.75 4.25L17.25 10L13.75 15.75M11.5 3.5L8.5 16.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}
