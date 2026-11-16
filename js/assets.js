// Illustrative activity photography. Credits and license links: docs/ASSET-CREDITS.md.
export const ASSETS = {
  business: {
    src: './assets/images/business.jpg',
    alt: 'Hands, a laptop, and a notebook around a workshop table',
    position: '50% 58%'
  },
  technology: {
    src: './assets/images/technology.jpg',
    alt: 'Close-up photograph of a blue circuit board and microcontroller',
    position: '50% 50%'
  },
  service: {
    src: './assets/images/service.jpg',
    alt: 'Food and household supplies being packed for donation',
    position: '58% 56%'
  },
  arts: {
    src: './assets/images/arts.jpg',
    alt: 'A collection of paint-covered artist brushes',
    position: '50% 46%'
  },
  leadership: {
    src: './assets/images/leadership.jpg',
    alt: 'Handwritten planning notes on a team whiteboard',
    position: '45% 44%'
  },
  athletics: {
    src: './assets/images/athletics.jpg',
    alt: 'Runners crossing the lanes of a red athletics track',
    position: '50% 22%'
  }
};

export function asset(key) {
  return ASSETS[key] || ASSETS.business;
}
