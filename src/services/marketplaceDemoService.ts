import type { BikeListing } from '@/models/bikeListing';
import type { MarketplaceFilter } from '@/models/marketplaceFilter';
import type { PaginatedResult } from '@/models/paginatedResult';
import type { MarketplaceService } from './marketplaceService';

const DEMO_LISTINGS: BikeListing[] = [
  {
    id: '1',
    title: 'Yamaha MT-15',
    make: 'Yamaha',
    model: 'MT-15',
    year: 2022,
    price: 4500000,
    cc: 155,
    type: 'Sport',
    sellerName: 'Aung Moe',
    location: 'Yangon',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    mileage: '8,400 Km',
    description: 'A sharp sport bike with excellent handling and style.',
  },
  {
    id: '2',
    title: 'Honda CB500X',
    make: 'Honda',
    model: 'CB500X',
    year: 2021,
    price: 9500000,
    cc: 471,
    type: 'Adventure',
    sellerName: 'Khin Hla',
    location: 'Mandalay',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    mileage: '12,200 Km',
    description: 'Comfortable touring-ready adventure bike with dependable Honda quality.',
  },
  {
    id: '3',
    title: 'Royal Enfield Classic 350',
    make: 'Royal Enfield',
    model: 'Classic 350',
    year: 2023,
    price: 6400000,
    cc: 349,
    type: 'Cruiser',
    sellerName: 'Thiri',
    location: 'Naypyitaw',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    mileage: '4,500 Km',
    description: 'Iconic cruiser with timeless styling and smooth ride quality.',
  },
  {
    id: '4',
    title: 'Kawasaki Z650',
    make: 'Kawasaki',
    model: 'Z650',
    year: 2020,
    price: 7800000,
    cc: 649,
    type: 'Standard',
    sellerName: 'Min Thu',
    location: 'Bago',
    imageUrl: 'https://images.unsplash.com/photo-1519937947077-74f88bc7ee82?auto=format&fit=crop&w=800&q=80',
    mileage: '9,100 Km',
    description: 'Nimble street bike with strong torque and confident mid-range power.',
  },
  {
    id: '5',
    title: 'BMW R NineT',
    make: 'BMW',
    model: 'R NineT',
    year: 2022,
    price: 24000000,
    cc: 1170,
    type: 'Custom',
    sellerName: 'Saw Htun',
    location: 'Taunggyi',
    imageUrl: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80',
    mileage: '2,000 Km',
    description: 'Premium naked roadster with classic design and modern performance.',
  },
  {
    id: '6',
    title: 'Suzuki V-Strom 650',
    make: 'Suzuki',
    model: 'V-Strom 650',
    year: 2021,
    price: 8800000,
    cc: 645,
    type: 'Touring',
    sellerName: 'Nandar',
    location: 'Mawlamyine',
    imageUrl: 'https://images.unsplash.com/photo-1470038716708-5f4485b722ea?auto=format&fit=crop&w=800&q=80',
    mileage: '18,300 Km',
    description: 'Adventure-ready touring bike built for long distance comfort.',
  },
  {
    id: '7',
    title: 'Ducati Monster 797',
    make: 'Ducati',
    model: 'Monster 797',
    year: 2019,
    price: 13200000,
    cc: 803,
    type: 'Sport',
    sellerName: 'Ei Mon',
    location: 'Pathein',
    imageUrl: 'https://images.unsplash.com/photo-1524705691455-2dbd6d6d9f6d?auto=format&fit=crop&w=800&q=80',
    mileage: '7,900 Km',
    description: 'Italian muscle with aggressive styling and responsive riding feel.',
  },
  {
    id: '8',
    title: 'Honda CB300R',
    make: 'Honda',
    model: 'CB300R',
    year: 2023,
    price: 5600000,
    cc: 286,
    type: 'Standard',
    sellerName: 'Zaw Myint',
    location: 'Pyay',
    imageUrl: 'https://images.unsplash.com/photo-1523430410477-8639ebcb9b7f?auto=format&fit=crop&w=800&q=80',
    mileage: '3,100 Km',
    description: 'Light and responsive modern classic for city riders.',
  },
  {
    id: '9',
    title: 'KTM 390 Duke',
    make: 'KTM',
    model: '390 Duke',
    year: 2022,
    price: 6100000,
    cc: 373,
    type: 'Sport',
    sellerName: 'Hla Hla',
    location: 'Sagaing',
    imageUrl: 'https://images.unsplash.com/photo-1597772854698-c0007c1b7d5e?auto=format&fit=crop&w=800&q=80',
    mileage: '5,700 Km',
    description: 'Lightweight sport machine built for fast street riding.',
  },
  {
    id: '10',
    title: 'Triumph Tiger 900',
    make: 'Triumph',
    model: 'Tiger 900',
    year: 2021,
    price: 17000000,
    cc: 888,
    type: 'Adventure',
    sellerName: 'Cho Cho',
    location: 'Hpa-An',
    imageUrl: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=800&q=80',
    mileage: '13,600 Km',
    description: 'Capable adventure bike with great road manners and touring comfort.',
  },
];

function applyFilter(item: BikeListing, filter: MarketplaceFilter) {
  const make = filter.make?.trim().toLowerCase();
  const model = filter.model?.trim().toLowerCase();
  const year = filter.modelYear?.trim();
  const min = filter.priceMin ?? 0;
  const max = filter.priceMax ?? Number.MAX_SAFE_INTEGER;
  const cc = filter.cc?.trim();
  const type = filter.type;

  if (make && !item.make?.toLowerCase().includes(make) && !item.title?.toLowerCase().includes(make)) {
    return false;
  }

  if (model && !item.model?.toLowerCase().includes(model) && !item.title?.toLowerCase().includes(model)) {
    return false;
  }

  if (year && String(item.year) !== year) {
    return false;
  }

  if (filter.priceMin != null && (item.price ?? 0) < min) {
    return false;
  }

  if (filter.priceMax != null && (item.price ?? 0) > max) {
    return false;
  }

  if (cc && !String(item.cc ?? '').startsWith(cc)) {
    return false;
  }

  if (type && item.type !== type) {
    return false;
  }

  if (filter.location && !item.location?.toLowerCase().includes(filter.location.trim().toLowerCase())) {
    return false;
  }

  return true;
}

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export class MarketplaceDemoService implements MarketplaceService {
  async getListings(filter: MarketplaceFilter, page: number, pageSize: number) {
    const filtered = DEMO_LISTINGS.filter((item) => applyFilter(item, filter));
    return paginate(filtered, page, pageSize);
  }

  async getListingById(id: string) {
    return DEMO_LISTINGS.find((item) => item.id === id);
  }

  async createListing(listing: BikeListing) {
    const newListing: BikeListing = {
      ...listing,
      id: String(Date.now()),
      sellerName: listing.sellerName ?? 'You',
      location: listing.location ?? 'Yangon',
      imageUrl: listing.images?.[0] ?? listing.imageUrl,
    };

    DEMO_LISTINGS.unshift(newListing);
    return newListing;
  }
}
