export const BRAND = {
  colors: {
    corporate: {
      nearBlack: "#262626",
      electricBlue: "#0D86FF",
      coral: "#FF632C",
      neonYellow: "#E5FF4A",
      limeGreen: "#B4FF00",
      offWhite: "#F2F2F2",
      lightGray: "#EAEAEA",
    },
    multihousing: {
      mhBlue: "#1DB5DE",
      mhGreen: "#C2D219",
    },
  },
  lines: ["OPL", "AAS", "MH", "Volta"] as const,
  lineLabels: {
    OPL: "Equipos Industriales",
    AAS: "Laundry as a Service",
    MH: "Lavanderías Compartidas",
    Volta: "Laundromats",
  },
} as const;

export type BusinessLine = (typeof BRAND.lines)[number];
