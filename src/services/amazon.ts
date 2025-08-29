import axios from 'axios';
import { Product } from '../types';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const AMAZON_API_HOST = import.meta.env.VITE_AMAZON_API_HOST;

export class AmazonService {
  private apiKey: string;
  private host: string;

  constructor() {
    this.apiKey = RAPIDAPI_KEY;
    this.host = AMAZON_API_HOST;
  }

  async searchProducts(keywords: string[], categories: string[]): Promise<Product[]> {
    try {
      const searchQuery = [...keywords, ...categories].join(' ');
      
      const response = await axios.get(
        `https://${this.host}/search`,
        {
          params: {
            query: searchQuery,
            country: 'US',
            page: 1
          },
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host
          }
        }
      );

      return this.transformAmazonProducts(response.data.products || []);
    } catch (error) {
      console.error('Amazon API error:', error);
      // Return mock products for demo purposes
      return this.getMockProducts(keywords);
    }
  }

  private transformAmazonProducts(amazonProducts: any[]): Product[] {
    return amazonProducts.slice(0, 8).map((product: any, index: number) => ({
      id: product.asin || `product-${index}`,
      title: product.title || 'Stylish Product',
      price: product.price || '$29.99',
      image: product.image || `https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=400`,
      rating: product.rating || 4.5,
      url: product.url || '#',
      description: product.description
    }));
  }

  private getMockProducts(keywords: string[]): Product[] {
    const mockProducts = [
      {
        id: '1',
        title: 'Vintage Leather Journal',
        price: '$24.99',
        image: 'https://images.pexels.com/photos/159751/book-address-book-learning-learn-159751.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 4.8,
        url: '#'
      },
      {
        id: '2',
        title: 'Minimalist Ceramic Vase',
        price: '$32.50',
        image: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 4.6,
        url: '#'
      },
      {
        id: '3',
        title: 'Cozy Knit Throw Blanket',
        price: '$45.00',
        image: 'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 4.9,
        url: '#'
      },
      {
        id: '4',
        title: 'Brass Desk Lamp',
        price: '$67.99',
        image: 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 4.7,
        url: '#'
      }
    ];

    return mockProducts;
  }
}

export const amazonService = new AmazonService();