type CarColor = 'silver_metallic' | 'milky_beige' | 'white' | 'metallic_blue';

type Car = {
  id: string;
  name: string;
  image: string;
  pricePerDay: number;
  seats: number;
  colors: CarColor[];
  category: 'small' | 'medium' | 'large';
  smallLuggage: number;
  largeLuggage: number;
  transmission: 'manual' | 'automatic';
};
export const CARS: Car[] = [
  {
    id: 'car-1',
    category: 'small',
    name: 'Kia Picanto',
    image: '/cars.webp',
    colors: ['silver_metallic', 'milky_beige', 'white'],
    pricePerDay: 35,
    seats: 4,
    smallLuggage: 3,
    largeLuggage: 1,
    transmission: 'manual',
  },
  {
    id: 'car-2',
    category: 'small',
    name: 'Hyundai i10',
    image: '/cars.webp',
    colors: ['white'],
    pricePerDay: 35,
    seats: 4,
    smallLuggage: 3,
    largeLuggage: 1,
    transmission: 'manual',
  },
  {
    id: 'car-3',
    category: 'medium',
    name: 'Kia Stonic',
    image: '/cars.webp',
    colors: ['silver_metallic', 'metallic_blue', 'white'],
    pricePerDay: 55,
    seats: 5,
    smallLuggage: 4,
    largeLuggage: 2,
    transmission: 'manual',
  },
  {
    id: 'car-4',
    category: 'medium',
    name: 'Hyundai i20',
    image: '/cars.webp',
    colors: ['white'],
    pricePerDay: 55,
    seats: 5,
    smallLuggage: 4,
    largeLuggage: 2,
    transmission: 'manual',
  },
  {
    id: 'car-5',
    category: 'large',
    name: 'Citroën Picanto C4',
    image: '/cars.webp',
    colors: ['silver_metallic'],
    pricePerDay: 75,
    seats: 7,
    smallLuggage: 7,
    largeLuggage: 4,
    transmission: 'manual',
  },
];

export type { Car, CarColor };
