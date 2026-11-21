import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "../lib/api";
import type { Product } from "../data/products";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "CUSTOMER" | "ADMIN";
};
type AuthContextValue = {
  user: Customer | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    try {
      const data = await apiRequest<{ user: Customer }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refresh,
      signIn: async (email, password) => {
        const data = await apiRequest<{ user: Customer }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setUser(data.user);
      },
      signUp: async (input) => {
        const data = await apiRequest<{ user: Customer }>("/auth/register", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setUser(data.user);
      },
      signOut: async () => {
        await apiRequest("/auth/logout", { method: "POST" });
        setUser(null);
      },
    }),
    [user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

type CartLine = { product: Product; quantity: number };
type CartContextValue = {
  items: CartLine[];
  count: number;
  totalPaise: number;
  add: (product: Product) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("itsuki-cart") ?? "[]",
      ) as CartLine[];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("itsuki-cart", JSON.stringify(items));
  }, [items]);
  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      totalPaise: items.reduce(
        (sum, line) => sum + line.product.pricePaise * line.quantity,
        0,
      ),
      add: (product) =>
        setItems((current) => {
          const found = current.find((line) => line.product.id === product.id);
          return found
            ? current.map((line) =>
                line.product.id === product.id
                  ? { ...line, quantity: Math.min(5, line.quantity + 1) }
                  : line,
              )
            : [...current, { product, quantity: 1 }];
        }),
      setQuantity: (id, quantity) =>
        setItems((current) =>
          quantity < 1
            ? current.filter((line) => line.product.id !== id)
            : current.map((line) =>
                line.product.id === id
                  ? { ...line, quantity: Math.min(5, quantity) }
                  : line,
              ),
        ),
      remove: (id) =>
        setItems((current) => current.filter((line) => line.product.id !== id)),
      clear: () => setItems([]),
    }),
    [items],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
