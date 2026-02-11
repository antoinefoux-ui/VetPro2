import React, { useState } from 'react';
import { ShoppingCart, Heart, Search, Star, Plus, Minus, X } from 'lucide-react';

const ECommerceShop = () => {
  const [language, setLanguage] = useState('en');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  const t = {
    en: { 
      shop: 'VetShop', search: 'Search products...', cart: 'Cart', checkout: 'Checkout',
      addToCart: 'Add to Cart', viewDetails: 'View Details', price: 'Price', 
      categories: { all: 'All Products', food: 'Food', medication: 'Medication', toys: 'Toys', health: 'Health' },
      outOfStock: 'Out of Stock', prescription: 'Prescription Required', inCart: 'In Cart'
    },
    fr: { 
      shop: 'VetShop', search: 'Rechercher...', cart: 'Panier', checkout: 'Payer',
      addToCart: 'Ajouter', viewDetails: 'Détails', price: 'Prix',
      categories: { all: 'Tous', food: 'Nourriture', medication: 'Médicaments', toys: 'Jouets', health: 'Santé' },
      outOfStock: 'Épuisé', prescription: 'Ordonnance requise', inCart: 'Au panier'
    },
    sk: { 
      shop: 'VetShop', search: 'Hľadať produkty...', cart: 'Košík', checkout: 'Pokladňa',
      addToCart: 'Pridať', viewDetails: 'Detail', price: 'Cena',
      categories: { all: 'Všetko', food: 'Jedlo', medication: 'Lieky', toys: 'Hračky', health: 'Zdravie' },
      outOfStock: 'Vypredané', prescription: 'Potrebný recept', inCart: 'V košíku'
    },
  };

  const lang = t[language];

  const products = [
    {
      id: 1, name: 'Premium Dog Food - Chicken & Rice', category: 'food', price: 45.99, 
      rating: 4.8, reviews: 342, stock: 25, image: '🍖', inStock: true, prescription: false,
      description: 'High-quality nutrition for adult dogs'
    },
    {
      id: 2, name: 'Flea & Tick Prevention', category: 'medication', price: 65.00,
      rating: 4.9, reviews: 589, stock: 12, image: '💊', inStock: true, prescription: true,
      description: 'Monthly topical treatment'
    },
    {
      id: 3, name: 'Interactive Puzzle Toy', category: 'toys', price: 24.99,
      rating: 4.6, reviews: 127, stock: 45, image: '🎾', inStock: true, prescription: false,
      description: 'Stimulates mental activity'
    },
    {
      id: 4, name: 'Dental Care Kit', category: 'health', price: 32.50,
      rating: 4.7, reviews: 234, stock: 0, image: '🦷', inStock: false, prescription: false,
      description: 'Complete dental hygiene set'
    },
    {
      id: 5, name: 'Cat Premium Food - Salmon', category: 'food', price: 39.99,
      rating: 4.9, reviews: 456, stock: 30, image: '🐟', inStock: true, prescription: false,
      description: 'Premium nutrition for cats'
    },
    {
      id: 6, name: 'Arthritis Joint Support', category: 'medication', price: 55.00,
      rating: 4.8, reviews: 278, stock: 8, image: '💉', inStock: true, prescription: true,
      description: 'Veterinary formula for joints'
    },
  ];

  const addToCart = (productId) => {
    setCart({ ...cart, [productId]: (cart[productId] || 0) + 1 });
  };

  const updateCart = (productId, quantity) => {
    if (quantity <= 0) {
      const newCart = { ...cart };
      delete newCart[productId];
      setCart(newCart);
    } else {
      setCart({ ...cart, [productId]: quantity });
    }
  };

  const getTotalItems = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const getTotalPrice = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const product = products.find(p => p.id === parseInt(id));
      return sum + (product?.price || 0) * qty;
    }, 0);
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🐾</span>
              </div>
              <span className="text-xl font-semibold">{lang.shop}</span>
            </div>

            {/* Language Switcher */}
            <div className="flex gap-2">
              {['en', 'fr', 'sk'].map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-3 py-1 rounded-lg font-bold text-sm ${
                    language === l ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Cart */}
            <button className="relative p-3 hover:bg-gray-100 rounded-full">
              <ShoppingCart className="w-6 h-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Premium Pet Care Products</h1>
          <p className="text-xl text-blue-100 mb-8">Everything your pet needs, delivered to your door</p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={lang.search}
                className="w-full pl-12 pr-4 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4 py-4 overflow-x-auto">
            {Object.entries(lang.categories).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-6 py-3 rounded-full whitespace-nowrap font-semibold transition-all ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-3xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              {/* Image */}
              <div className="relative aspect-square bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-9xl group-hover:scale-110 transition-transform duration-500">
                  {product.image}
                </div>
                
                {/* Badges */}
                {product.prescription && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    Rx
                  </div>
                )}
                {!product.inStock && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded-full">
                    {lang.outOfStock}
                  </div>
                )}

                {/* Wishlist */}
                <button 
                  className="absolute top-4 right-4 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Heart className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
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

                {/* Price & Add */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      €{product.price.toFixed(2)}
                    </div>
                    {product.stock < 10 && product.inStock && (
                      <div className="text-xs text-orange-600 mt-1">
                        Only {product.stock} left
                      </div>
                    )}
                  </div>

                  {cart[product.id] ? (
                    <div className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-3 py-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); updateCart(product.id, cart[product.id] - 1); }}
                        className="hover:bg-blue-700 rounded-full p-1"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-6 text-center">{cart[product.id]}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateCart(product.id, cart[product.id] + 1); }}
                        className="hover:bg-blue-700 rounded-full p-1"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.inStock) addToCart(product.id);
                      }}
                      disabled={!product.inStock}
                      className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
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
            className="bg-white rounded-3xl max-w-2xl w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold">{selectedProduct.name}</h2>
              <button onClick={() => setSelectedProduct(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="text-8xl mb-6 text-center">{selectedProduct.image}</div>

            <div className="flex items-center gap-2 mb-4">
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
              <span>{selectedProduct.rating} ({selectedProduct.reviews} reviews)</span>
            </div>

            <p className="text-gray-600 mb-6">{selectedProduct.description}</p>

            <div className="text-4xl font-bold mb-6">€{selectedProduct.price.toFixed(2)}</div>

            {selectedProduct.prescription && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 font-semibold">⚠️ {lang.prescription}</p>
              </div>
            )}

            <button
              onClick={() => {
                if (selectedProduct.inStock) {
                  addToCart(selectedProduct.id);
                  setSelectedProduct(null);
                }
              }}
              disabled={!selectedProduct.inStock}
              className="w-full py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {selectedProduct.inStock ? lang.addToCart : lang.outOfStock}
            </button>
          </div>
        </div>
      )}

      {/* Floating Cart */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-8 right-8 bg-white rounded-2xl shadow-2xl border p-6 w-80">
          <h3 className="text-lg font-bold mb-4">{lang.cart} ({getTotalItems()})</h3>
          
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {Object.entries(cart).map(([id, qty]) => {
              const product = products.find(p => p.id === parseInt(id));
              return (
                <div key={id} className="flex items-center gap-3">
                  <div className="text-3xl">{product?.image}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm line-clamp-1">{product?.name}</div>
                    <div className="text-gray-600 text-sm">{qty} × €{product?.price.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>€{getTotalPrice().toFixed(2)}</span>
            </div>
          </div>

          <button className="w-full py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700">
            {lang.checkout}
          </button>
        </div>
      )}
    </div>
  );
};

export default ECommerceShop;
