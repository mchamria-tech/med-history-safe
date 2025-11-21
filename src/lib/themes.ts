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
    id: "theme-1",
    name: "Purple & Yellow",
    description: "Modern wellness vibe",
    colors: {
      primary: "hsl(280, 85%, 62%)",
      accent: "hsl(45, 95%, 60%)",
      background: "hsl(270, 30%, 96%)",
    },
  },
  {
    id: "theme-2",
    name: "Sunset & Coral",
    description: "Warm and approachable",
    colors: {
      primary: "hsl(15, 85%, 58%)",
      accent: "hsl(340, 75%, 65%)",
      background: "hsl(25, 35%, 96%)",
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
    id: "theme-6",
    name: "Wellness & Vitality",
    description: "Vibrant teal & energetic orange",
    colors: {
      primary: "hsl(180, 70%, 40%)",
      accent: "hsl(25, 90%, 55%)",
      background: "hsl(180, 25%, 97%)",
    },
  },
  {
    id: "theme-7",
    name: "Pediatric Care",
    description: "Soft sky blue & cheerful yellow",
    colors: {
      primary: "hsl(200, 75%, 65%)",
      accent: "hsl(48, 95%, 60%)",
      background: "hsl(200, 40%, 98%)",
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
    id: "theme-9",
    name: "Minimalist Mono",
    description: "Black & bright blue accent",
    colors: {
      primary: "hsl(210, 100%, 50%)",
      accent: "hsl(210, 100%, 50%)",
      background: "hsl(0, 0%, 100%)",
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
];
