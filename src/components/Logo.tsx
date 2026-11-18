export function Logo({ size = 48 }: { size?: number }) {
  return (
    <img src="/logo.png" alt="MES-G logo" width={size} height={size} style={{ objectFit: "contain" }} />
  );
}