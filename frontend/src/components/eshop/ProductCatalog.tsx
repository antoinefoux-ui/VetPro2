import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Search, Filter, Star, Plus, Minus, Check } from 'lucide-react';
import { t } from '../../locales/translations';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  inStock: boolean;
  stockLevel: number;
  rating: number;
  reviews: number;
  isPrescription: boolean;
}

export const ECommerceShop: React.FC<{ language?: string }> = ({ language = 'en' }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    // API call to fetch products
    // For now, mock data
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Premium Dog Food - Chicken & Rice',
        description: 'High-quality nutrition for adult dogs. Made with real chicken and brown rice.',
        price: 45.99,
        images: ['https://via.placeholder.com/600x600/4A90E2/ffffff?text=Dog+Food'],
        category: 'food',
        inStock: true,
        stockLevel: 25,
        rating: 4.8,
        reviews: 342,
        isPrescription: false,
      },
      {
        id: '2',
        name: 'Flea & Tick Prevention',
        description: 'Monthly topical treatment for dogs. Kills fleas, ticks, and mosquitoes.',
        price: 65.00,
        images: ['https://via.placeholder.com/600x600/50C878/ffffff?text=Flea+Treatment'],
        category: 'medication',
        inStock: true,
        stockLevel: 12,
        rating: 4.9,
        reviews: 589,
        isPrescription: true,
      },
      {
        id: '3',
        name: 'Interactive Puzzle Toy',
        description: 'Stimulates mental activity and reduces boredom. Durable and safe.',
        price: 24.99,
        images: ['https://via.placeholder.com/600x600/FF6B6B/ffffff?text=Toy'],
        category: 'toys',
        inStock: true,
        stockLevel: 45,
        rating: 4.6,
        reviews: 127,
        isPrescription: false,
      },
      {
        id: '4',
        name: 'Dental Care Kit',
        description: 'Complete dental hygiene set including toothbrush, toothpaste, and dental treats.',
        price: 32.50,
        images: ['https://via.placeholder.com/600x600/9B59B6/ffffff?text=Dental+Kit'],
        category: 'health',
        inStock: true,
        stockLevel: 18,
        rating: 4.7,
        reviews: 234,
        isPrescription: false,
      },
    ];
    setProducts(mockProducts);
  };

  const addToCart = (productId: string, quantity: number = 1) => {
    const newCart = new Map(cart);
    newCart.set(productId, (newCart.get(productId) || 0) + quantity);
    setCart(newCart);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const newCart = new Map(cart);
    if (quantity <= 0) {
      newCart.delete(productId);
    } else {
      newCart.set(productId, quantity);
    }
    setCart(newCart);
  };

  const getTotalItems = () => {
    return Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Array.from(cart.entries()).reduce((sum, [productId, qty]) => {
      const product = products.find(p => p.id === productId);
      return sum + (product?.price || 0) * qty;
    }, 0);
  };

  const categories = [
    { id: 'all', name: t('eshop.allProducts', language), icon: '🏪' },
    { id: 'food', name: t('eshop.food', language), icon: '🍖' },
    { id: 'medication', name: t('eshop.medication', language), icon: '💊' },
    { id: 'toys', name: t('eshop.toys', language), icon: '🎾' },
    { id: 'health', name: t('eshop.health', language), icon: '🏥' },
  ];

  const filteredProducts = products.filter(product => 
    (selectedCategory === 'all' || product.category === selectedCategory) &&
    (searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white">
      
      {/* Apple-style Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🐾</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">VetShop</span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('common.search', language)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Cart */}
            <button className="relative p-3 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8 py-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">
            {t('eshop.heroTitle', language) || 'Premium Pet Care Products'}
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            {t('eshop.heroSubtitle', language) || 'Everything your pet needs, delivered to your door'}
          </p>
          <button className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold hover:bg-blue-50 transition-all shadow-lg">
            {t('eshop.shopNow', language) || 'Shop Now'}
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {t('eshop.products', language) || 'Products'}
          </h2>
          <span className="text-gray-600">
            {filteredProducts.length} {t('eshop.productsFound', language)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="group cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              {/* Product Card - Apple Style */}
              <div className="bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
                
                {/* Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.isPrescription && (
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        Rx
                      </span>
                    )}
                    {!product.inStock && (
                      <span className="px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded-full">
                        {t('eshop.outOfStock', language)}
                      </span>
                    )}
                  </div>

                  {/* Wishlist */}
                  <button className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        €{product.price.toFixed(2)}
                      </div>
                      {product.stockLevel < 10 && product.inStock && (
                        <div className="text-xs text-orange-600 mt-1">
                          {t('eshop.onlyXLeft', language)} {product.stockLevel}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product.id);
                      }}
                      disabled={!product.inStock}
                      className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 gap-8 p-8">
              
              {/* Image */}
              <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedProduct.name}
                </h2>

                <div className="flex items-center gap-2 mb-6">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(selectedProduct.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">
                    {selectedProduct.rating} ({selectedProduct.reviews} reviews)
                  </span>
                </div>

                <p className="text-gray-600 mb-6">
                  {selectedProduct.description}
                </p>

                <div className="text-4xl font-bold text-gray-900 mb-6">
                  €{selectedProduct.price.toFixed(2)}
                </div>

                {selectedProduct.isPrescription && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-red-700 font-semibold">
                      ⚠️ {t('eshop.prescriptionRequired', language) || 'Prescription required'}
                    </p>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-gray-700 font-semibold">
                    {t('eshop.quantity', language)}:
                  </span>
                  <div className="flex items-center gap-3">
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold">1</span>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    addToCart(selectedProduct.id);
                    setSelectedProduct(null);
                  }}
                  disabled={!selectedProduct.inStock}
                  className="w-full py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {selectedProduct.inStock 
                    ? t('eshop.addToCart', language)
                    : t('eshop.outOfStock', language)
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Summary */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-8 right-8 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t('eshop.cart', language)} ({getTotalItems()})
          </h3>
          
          <div className="space-y-3 mb-4">
            {Array.from(cart.entries()).map(([productId, qty]) => {
              const product = products.find(p => p.id === productId);
              if (!product) return null;
              
              return (
                <div key={productId} className="flex items-center gap-3">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm line-clamp-1">
                      {product.name}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {qty} × €{product.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex justify-between text-lg font-bold">
              <span>{t('invoice.total', language)}:</span>
              <span>€{getTotalPrice().toFixed(2)}</span>
            </div>
          </div>

          <button className="w-full py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors">
            {t('eshop.checkout', language)}
          </button>
        </div>
      )}
    </div>
  );
};

export default ECommerceShop;
