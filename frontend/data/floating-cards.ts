export type BackgroundCard = {
  id: string;
  name: string;
  src: string;
};

export const BACKGROUND_CARDS: BackgroundCard[] = [
  {
    id: "chase-sapphire-preferred",
    name: "Chase Sapphire Preferred",
    src: "/cards/chase-sapphire-preferred.png",
  },
  {
    id: "amex-gold",
    name: "American Express Gold Card",
    src: "/cards/amex-gold.png",
  },
  {
    id: "capital-one-venture-x",
    name: "Capital One Venture X",
    src: "/cards/capital-one-venture-x.png",
  },
  {
    id: "citi-strata-premier",
    name: "Citi Strata Premier",
    src: "/cards/citi-strata-premier.webp",
  },
  {
    id: "chase-freedom-unlimited",
    name: "Chase Freedom Unlimited",
    src: "/cards/chase-freedom-unlimited.png",
  },
  {
    id: "wells-fargo-autograph",
    name: "Wells Fargo Autograph",
    src: "/cards/wells-fargo-autograph.png",
  },
  {
    id: "bilt-mastercard",
    name: "Bilt Mastercard",
    src: "/cards/bilt-mastercard.png",
  },
  {
    id: "chase-sapphire-reserve",
    name: "Chase Sapphire Reserve",
    src: "/cards/chase-sapphire-reserve.png",
  },
];

export type FloatingCard = BackgroundCard & {
  className: string;
  duration: number;
  delay: number;
};

/** Idle floating cards — continuous drift, no mouse tracking */
export const FLOATING_CARDS: FloatingCard[] = [
  {
    ...BACKGROUND_CARDS[0],
    className: "left-[-3%] top-[12%] w-[220px] rotate-[-12deg] opacity-90",
    duration: 16,
    delay: 0,
  },
  {
    ...BACKGROUND_CARDS[1],
    className: "right-[-4%] top-[14%] w-[230px] rotate-[11deg] opacity-90",
    duration: 14,
    delay: -2,
  },
  {
    ...BACKGROUND_CARDS[2],
    className: "left-[7%] bottom-[10%] w-[210px] rotate-[8deg] opacity-75",
    duration: 15,
    delay: -4,
  },
  {
    ...BACKGROUND_CARDS[3],
    className: "right-[6%] bottom-[8%] w-[215px] rotate-[-7deg] opacity-80",
    duration: 13,
    delay: -1,
  },
  {
    ...BACKGROUND_CARDS[4],
    className: "left-[18%] top-[6%] w-[150px] rotate-[5deg] opacity-45",
    duration: 18,
    delay: -6,
  },
  {
    ...BACKGROUND_CARDS[5],
    className: "right-[18%] top-[5%] w-[155px] rotate-[-6deg] opacity-50",
    duration: 17,
    delay: -3,
  },
  {
    ...BACKGROUND_CARDS[6],
    className:
      "left-[42%] bottom-[4%] w-[170px] rotate-[3deg] opacity-55 max-md:hidden",
    duration: 19,
    delay: -5,
  },
  {
    ...BACKGROUND_CARDS[7],
    className:
      "right-[38%] top-[8%] w-[145px] rotate-[-4deg] opacity-40 max-md:hidden",
    duration: 20,
    delay: -7,
  },
];
