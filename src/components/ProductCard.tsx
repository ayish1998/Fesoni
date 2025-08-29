import React from 'react';
import { Star, ExternalLink, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  index: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  const [isLiked, setIsLiked] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-gray-900/70 backdrop-blur-lg rounded-2xl overflow-hidden shadow-xl 
                 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 group border border-white/10"
    >
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        
        {/* Like Button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md 
                     hover:bg-black/70 transition-colors shadow-md"
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500 fill-current' : 'text-white'}`} 
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-5 space-y-4">
        <h3 className="text-white font-semibold text-lg leading-snug line-clamp-2 
                       group-hover:text-blue-400 transition-colors">
          {product.title}
        </h3>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {product.price}
          </span>
          
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-gray-300 text-sm">
              {product.rating}
            </span>
          </div>
        </div>

        {product.description && (
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
            {product.description}
          </p>
        )}

        <motion.a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 w-full 
                     bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600
                     text-white font-medium py-2.5 px-4 rounded-xl shadow-lg transition-all duration-300"
        >
          <span>View on Amazon</span>
          <ExternalLink className="w-4 h-4" />
        </motion.a>
      </div>
    </motion.div>
  );
};
