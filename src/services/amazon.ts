// src/services/amazon.ts
import axios from 'axios';
import { Product } from '../types';
import { apiGateway } from './apiGateway';
import { messageQueueService } from './messageQueue';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const AMAZON_API_HOST = import.meta.env.VITE_AMAZON_API_HOST;

export class AmazonService {
  private apiKey: string;
  private host: string;
  private searchUrl: string;
  private detailsUrl: string;

  constructor() {
    this.apiKey = RAPIDAPI_KEY;
    this.host = AMAZON_API_HOST || 'axesso-axesso-amazon-data-service-v1.p.rapidapi.com';
    this.searchUrl = `https://${this.host}/amz/amazon-search-by-keyword-asin`;
    this.detailsUrl = `https://${this.host}/amz/amazon-lookup-product`;
  }

  async searchProducts(keywords: string[], categories: string[] = []): Promise<Product[]> {
    try {
      const searchQuery = [...keywords, ...categories].join(' ');
      
      // Use RapidAPI directly with proper parameters
      const response = await axios.get(this.searchUrl, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.host
        },
        params: {
          domainCode: 'com',
          keyword: searchQuery,
          page: 1,
          excludeSponsored: 'false',
          sortBy: 'relevanceblender',
          withCache: 'true'
        },
        timeout: 10000
      });

      if (response.data?.responseStatus === 'PRODUCT_FOUND_RESPONSE') {
        const products = this.formatSearchProducts(response.data.searchProductDetails || []);
        
        await messageQueueService.sendNotification(
          `Found ${products.length} products matching your aesthetic!`,
          'success'
        );
        
        return products.slice(0, 12); // Limit to 12 products
      } else {
        console.warn('No products found for keywords:', keywords);
        await messageQueueService.sendNotification(
          'No products found for your search, try different keywords',
          'warning'
        );
        return [];
      }
    } catch (error) {
      console.error('Amazon RapidAPI error:', error);
      await messageQueueService.sendNotification(
        'Amazon search temporarily unavailable',
        'error'
      );
      return [];
    }
  }

  async searchProductsAsync(keywords: string[], categories: string[] = []): Promise<string> {
    // Queue the search task through LavinMQ
    const taskId = await messageQueueService.addTask(`amazon-search:${keywords.join(',')}`);
    
    // Process the search asynchronously
    this.processAsyncSearch(taskId, keywords, categories);
    
    return taskId;
  }

  private async processAsyncSearch(taskId: string, keywords: string[], categories: string[]): Promise<void> {
    try {
      // Perform multiple parallel searches for different product categories
      const searchPromises = categories.length > 0 
        ? categories.map(category => this.searchSingleCategory([...keywords, category]))
        : [this.searchProducts(keywords, categories)];

      const results = await Promise.all(searchPromises);
      const allProducts = results.flat();

      // Notify completion through message queue
      await messageQueueService.sendNotification(
        `Found ${allProducts.length} products matching your ${keywords.join(' ')} aesthetic!`,
        'success'
      );

      // Store results (in a real app, you'd save to database)
      console.log(`Task ${taskId} completed with ${allProducts.length} products`);
    } catch (error) {
      console.error('Async search error:', error);
      await messageQueueService.sendNotification('Search completed with some limitations', 'warning');
    }
  }

  private async searchSingleCategory(searchTerms: string[]): Promise<Product[]> {
    return await this.searchProducts(searchTerms, []);
  }

  async getProductDetails(productUrl: string): Promise<Product | null> {
    try {
      const response = await axios.get(this.detailsUrl, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.host
        },
        params: {
          url: productUrl
        },
        timeout: 15000
      });

      if (response.data?.responseStatus === 'PRODUCT_FOUND_RESPONSE') {
        return this.formatDetailedProduct(response.data);
      }
      
      return null;
    } catch (error) {
      console.error('Product details error:', error);
      return null;
    }
  }

  async getProductDetailsByAsin(asin: string): Promise<Product | null> {
    const amazonUrl = `https://www.amazon.com/dp/${asin}/`;
    return await this.getProductDetails(amazonUrl);
  }

  private formatSearchProducts(productDetails: any[]): Product[] {
    return productDetails.map((product: any) => {
      const rating = this.parseRating(product.productRating);
      const dpUrl = product.dpUrl || '';
      const fullUrl = dpUrl ? `https://amazon.com${dpUrl}` : '';

      return {
        id: product.asin || `product-${Date.now()}-${Math.random()}`,
        title: product.productDescription || 'Product',
        price: product.price || '$0.00',
        image: product.imgUrl || '',
        rating: rating,
        url: fullUrl,
        description: product.productDescription,
        category: product.category,
        aestheticMatch: 0.8 // Will be calculated later based on aesthetic analysis
      };
    });
  }

  private formatDetailedProduct(productData: any): Product {
    const rating = this.parseRating(productData.productRating);
    
    return {
      id: productData.asin || `detailed-${Date.now()}`,
      title: productData.productTitle || 'Product',
      price: productData.price || '$0.00',
      image: productData.mainImage?.imageUrl || '',
      rating: rating,
      url: `https://amazon.com/dp/${productData.asin}/`,
      description: productData.productDescription || '',
      category: productData.categories?.[0] || 'general'
    };
  }

  private parseRating(ratingStr: string): number {
    try {
      if (!ratingStr) return 0;
      const match = ratingStr.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  // Enhanced search with cultural context
  async searchWithCulturalContext(
    culturalContext: {
      aestheticKeywords: string[];
      stylePreferences: string[];
      moodDescriptors: string[];
      categories: string[];
    }
  ): Promise<Product[]> {
    try {
      const allKeywords = [
        ...culturalContext.aestheticKeywords,
        ...culturalContext.stylePreferences,
        ...culturalContext.moodDescriptors
      ];

      const products = await this.searchProducts(allKeywords, culturalContext.categories);
      
      // Calculate cultural match scores
      return products.map(product => ({
        ...product,
        aestheticMatch: this.calculateCulturalMatchScore(product, culturalContext)
      })).sort((a, b) => (b.aestheticMatch || 0) - (a.aestheticMatch || 0));
      
    } catch (error) {
      console.error('Cultural context search error:', error);
      return [];
    }
  }

  private calculateCulturalMatchScore(
    product: Product, 
    culturalContext: {
      aestheticKeywords: string[];
      stylePreferences: string[];
      moodDescriptors: string[];
    }
  ): number {
    const titleLower = product.title.toLowerCase();
    const descriptionLower = (product.description || '').toLowerCase();
    
    let score = 0;
    
    // Check aesthetic keywords (highest weight)
    const aestheticMatches = culturalContext.aestheticKeywords.filter(keyword =>
      titleLower.includes(keyword.toLowerCase()) || descriptionLower.includes(keyword.toLowerCase())
    );
    score += aestheticMatches.length * 0.4;
    
    // Check style preferences
    const styleMatches = culturalContext.stylePreferences.filter(pref =>
      titleLower.includes(pref.toLowerCase()) || descriptionLower.includes(pref.toLowerCase())
    );
    score += styleMatches.length * 0.3;
    
    // Check mood descriptors
    const moodMatches = culturalContext.moodDescriptors.filter(mood =>
      titleLower.includes(mood.toLowerCase()) || descriptionLower.includes(mood.toLowerCase())
    );
    score += moodMatches.length * 0.2;
    
    // Rating bonus
    if (product.rating > 4.5) score += 0.05;
    else if (product.rating > 4.0) score += 0.03;
    
    return Math.min(score, 1.0);
  }
}

export const amazonService = new AmazonService();
