/** @type {import('next').NextConfig} */

// En-têtes de sécurité (ultrareview). On applique les protections SANS risque de rendu
// (clickjacking, sniffing, référent, HSTS, permissions). La CSP n'est PAS ajoutée ici :
// elle exige une vérification runtime (next/font, styles inline recharts) et une CSP trop
// stricte casserait le rendu — à ajouter dans une passe dédiée avec test navigateur.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
]

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
