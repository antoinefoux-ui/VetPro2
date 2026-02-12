import React from 'react';
import ProductCatalog from '../components/eshop/productcatalog.tsx';

function Eshop() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">E-Shop</h1>
      <ProductCatalog />
    </div>
  );
}

export default Eshop;
