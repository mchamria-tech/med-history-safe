export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
  };
}

export const themes: Theme[] = [
  {
    id: "theme-0",
    name: "Original",
    description: "Blue & Green - Classic medical theme",
    colors: {
      primary: "hsl(199, 85%, 58%)",
      accent: "hsl(115, 55%, 55%)",
      background: "hsl(0, 0%, 98%)",
    },
  },
  {
    id: "theme-4",
    name: "Calm & Clinical",
    description: "Spa-like medical feel",
    colors: {
      primary: "hsl(172, 83%, 31%)",
      accent: "hsl(78, 80%, 45%)",
      background: "hsl(40, 15%, 97%)",
    },
  },
  {
    id: "theme-5",
    name: "Professional Healthcare",
    description: "Deep navy & medical red",
    colors: {
      primary: "hsl(215, 60%, 35%)",
      accent: "hsl(355, 75%, 50%)",
      background: "hsl(210, 20%, 98%)",
    },
  },
  {
    id: "theme-8",
    name: "Dark Medical",
    description: "Electric cyan & mint on dark",
    colors: {
      primary: "hsl(185, 90%, 55%)",
      accent: "hsl(150, 60%, 65%)",
      background: "hsl(200, 25%, 12%)",
    },
  },
  {
    id: "theme-10",
    name: "Nature & Healing",
    description: "Forest green & warm amber",
    colors: {
      primary: "hsl(145, 60%, 35%)",
      accent: "hsl(35, 80%, 55%)",
      background: "hsl(120, 15%, 97%)",
    },
  },
  {
    id: "theme-11",
    name: "Burgundy & Gold",
    description: "Rich and professional elegance",
    colors: {
      primary: "hsl(345, 65%, 40%)",
      accent: "hsl(45, 85%, 55%)",
      background: "hsl(30, 20%, 97%)",
    },
  },
  {
    id: "theme-12",
    name: "Slate & Mint",
    description: "Modern clean aesthetic",
    colors: {
      primary: "hsl(210, 40%, 45%)",
      accent: "hsl(165, 70%, 55%)",
      background: "hsl(210, 15%, 98%)",
    },
  },
  {
    id: "theme-15",
    name: "Charcoal & Amber",
    description: "Warm sophisticated light mode",
    colors: {
      primary: "hsl(210, 20%, 30%)",
      accent: "hsl(30, 85%, 60%)",
      background: "hsl(0, 0%, 100%)",
    },
  },
];
