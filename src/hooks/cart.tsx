import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { ProductPrice } from 'src/pages/Cart/styles';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem('@GMarketplace:cart');

      if (productsStorage) {
        setProducts(JSON.parse(productsStorage));
      }
    }

    loadProducts();
  }, []);

  const saveStorage = useCallback(async (): Promise<void> => {
    await AsyncStorage.setItem('@GMarketplace:cart', JSON.stringify(products));
  }, [products]);

  const increment = useCallback(
    async id => {
      const listProducts = products.map(p => {
        if (p.id === id) {
          return { ...p, quantity: p.quantity + 1 };
        }
        return p;
      });
      setProducts(listProducts);
      await saveStorage();
    },
    [products, saveStorage],
  );

  const decrement = useCallback(
    async id => {
      const listProducts = products
        .map(p => {
          if (p.id === id) {
            return { ...p, quantity: p.quantity - 1 };
          }
          return p;
        })
        .filter(p => p.quantity > 0);

      setProducts(listProducts);
      await saveStorage();
    },
    [products, saveStorage],
  );

  const addToCart = useCallback(
    async product => {
      if (products.find(p => p.id === product.id)) {
        increment(product.id);
      } else {
        setProducts(oldState => [...oldState, { ...product, quantity: 1 }]);
        await saveStorage();
      }
    },
    [products, increment, saveStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
