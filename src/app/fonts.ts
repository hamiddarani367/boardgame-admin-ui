import localFont from "next/font/local";

export const iranYekan = localFont({
  src: [
    {
      path: "../../public/fonts/iranyekanwebregular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/iranyekanwebmedium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/iranyekanwebbold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-iran-yekan",
  display: "swap",
});

export const cube = localFont({
  src: "../../public/fonts/cube.woff",
  variable: "--font-cube",
  display: "swap",
});