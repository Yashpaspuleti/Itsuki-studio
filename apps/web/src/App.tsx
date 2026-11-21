import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Gem,
  Heart,
  House,
  Leaf,
  Mail,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { ProductCard } from "./components/ProductCard";
import { products as fallbackProducts, type Product } from "./data/products";
import { apiRequest } from "./lib/api";
import "./styles.css";
import { AuthProvider, CartProvider, useCart } from "./context/store";
import {
  AccountPage,
  AdminPage,
  AuthPage,
  CartPage,
  CheckoutPage,
  OrdersPage,
  ProductPage,
} from "./pages/CommercePages";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

type ProductsResponse = {
  products: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    pricePaise: number;
    imageUrl: string;
    stock: number;
  }>;
};

function HomePage() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [inventoryStatus, setInventoryStatus] = useState<
    "loading" | "ready" | "fallback" | "error"
  >("fallback");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const { add } = useCart();

  useEffect(() => {
    let active = true;

    apiRequest<ProductsResponse>("/products")
      .then(({ products: inventory }) => {
        if (!active) return;
        if (inventory.length > 0) {
          setProducts(
            inventory.map((product) => ({
              ...product,
              tagline: product.description.split(".")[0] + ".",
              alt: product.name,
              image: product.imageUrl,
              details: [],
            })),
          );
        }
        setInventoryStatus("ready");
      })
      .catch(() => {
        if (active) setInventoryStatus("fallback");
      });

    return () => {
      active = false;
    };
  }, []);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      showToast("Thanks for subscribing!", "success");
    }
  };

  const retryLoad = () => {
    setInventoryStatus("loading");
    let active = true;
    apiRequest<ProductsResponse>("/products")
      .then(({ products: inventory }) => {
        if (!active) return;
        if (inventory.length > 0) {
          setProducts(
            inventory.map((product) => ({
              ...product,
              tagline: product.description.split(".")[0] + ".",
              alt: product.name,
              image: product.imageUrl,
              details: [],
            })),
          );
        }
        setInventoryStatus("ready");
      })
      .catch(() => {
        if (active) setInventoryStatus("error");
      });
    return () => {
      active = false;
    };
  };

  return (
    <div id="home" className="page-shell">
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy stagger-in">
            <span className="eyebrow animate-in">
              LIGHT, DESIGNED TO FEEL LIKE HOME
            </span>
            <h1 id="hero-title" className="animate-in animate-in-delay-1">
              Light up
              <br />
              your <em>moments.</em>
            </h1>
            <p className="hero-description animate-in animate-in-delay-2">
              Thoughtfully designed lamps to bring warmth and calm into your
              home.
            </p>
            <a
              className="btn btn-primary animate-in animate-in-delay-3"
              href="#collection"
            >
              Explore collection
              <ArrowRight size={17} />
            </a>
            <span
              className="scroll-cue animate-in animate-in-delay-4"
              aria-hidden="true"
            >
              ↓ <small>SCROLL TO EXPLORE</small>
            </span>
          </div>
          <div
            className="hero-image"
            role="img"
            aria-label="Sculptural lamps in the Itsuki Studio collection"
          >
            <img
              src="/images/hero-lamps.jpg"
              alt="Warm sculptural Itsuki Studio lamps"
            />
          </div>
        </section>

        <section id="collection" className="collection section">
          <div className="container">
            <header className="section-header stagger-in">
              <p className="eyebrow">THE COLLECTION</p>
              <h2>Objects of light.</h2>
              <p>Unique designs. Timeless appeal.</p>
            </header>

            {inventoryStatus === "loading" && (
              <div
                className="inventory-status"
                role="status"
                aria-live="polite"
              >
                <Loader2
                  className="loading-spinner"
                  size={24}
                  aria-hidden="true"
                />
                <span style={{ marginLeft: "var(--space-3)" }}>
                  Loading the collection…
                </span>
              </div>
            )}

            {inventoryStatus === "error" && (
              <div className="error-message" role="alert">
                <p>Unable to load products. Please try again.</p>
                <button className="btn btn-secondary" onClick={retryLoad}>
                  Retry
                </button>
              </div>
            )}

            {inventoryStatus !== "loading" && inventoryStatus !== "error" && (
              <div className="product-grid stagger-in">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={add} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          id="story"
          className="story"
          style={
            {
              "--story-image-url": `url('/images/geometric-lamp.jpg')`,
            } as React.CSSProperties
          }
        >
          <div className="story-content stagger-in">
            <p className="eyebrow animate-in">
              <span aria-hidden="true" /> OUR STORY
            </p>
            <h2 className="animate-in animate-in-delay-1">
              A studio of
              <br />
              light & design.
            </h2>
            <p className="animate-in animate-in-delay-2">
              At Itsuki Studio, we believe light can transform the feeling of a
              space. We bring modern design and thoughtful making together to
              create pieces that feel at home in yours.
            </p>
            <a
              className="text-link animate-in animate-in-delay-3"
              href="#journal"
            >
              Discover our story
              <ArrowUpRight size={17} />
            </a>
          </div>
          <div
            className="story-image"
            role="img"
            aria-label="Geometric lamp by Itsuki Studio"
          />
        </section>

        <section className="values section" aria-label="Our values">
          <div className="container">
            <div className="values-grid stagger-in">
              <div className="value-item animate-in">
                <div className="value-icon" aria-hidden="true">
                  <Gem size={24} />
                </div>
                <h3 className="value-title">Considered design</h3>
                <p className="value-description">Elegant, expressive forms</p>
              </div>
              <div className="value-item animate-in animate-in-delay-1">
                <div className="value-icon" aria-hidden="true">
                  <Leaf size={24} />
                </div>
                <h3 className="value-title">Thoughtful materials</h3>
                <p className="value-description">
                  Made with care and intention
                </p>
              </div>
              <div className="value-item animate-in animate-in-delay-2">
                <div className="value-icon" aria-hidden="true">
                  <House size={24} />
                </div>
                <h3 className="value-title">Made for your spaces</h3>
                <p className="value-description">
                  A little warmth, wherever you need it
                </p>
              </div>
              <div className="value-item animate-in animate-in-delay-3">
                <div className="value-icon" aria-hidden="true">
                  <Heart size={24} />
                </div>
                <h3 className="value-title">Small studio, big heart</h3>
                <p className="value-description">Every detail matters</p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="journal"
          className="newsletter"
          aria-labelledby="newsletter-title"
        >
          <div className="container">
            <div className="newsletter-content stagger-in">
              <div className="animate-in">
                <p id="newsletter-title" className="eyebrow">
                  NOTES FROM THE STUDIO
                </p>
                <h2 className="animate-in-delay-1">
                  A little light in your inbox.
                </h2>
                <p className="animate-in-delay-2">
                  New designs, studio notes and occasional offers. No noise.
                </p>
              </div>
              <form
                onSubmit={subscribe}
                className="subscribe-form animate-in animate-in-delay-3"
              >
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <Mail className="subscribe-icon" size={18} aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Your email address"
                  required
                  autoComplete="email"
                  aria-label="Email address for newsletter"
                />
                <button type="submit" aria-label="Subscribe to newsletter">
                  <ChevronRight size={20} />
                </button>
              </form>
              {subscribed && (
                <p className="subscribe-success" role="status">
                  Thank you — you're on the list.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      {toast && (
        <div
          className={`toast visible ${toast.type}`}
          role="alert"
          aria-live="polite"
        >
          {toast.type === "success" ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function StoreApp() {
  const { items, count, remove } = useCart();
  return (
    <>
      <Header
        cartCount={count}
        cart={items.map((line) => ({
          ...line.product,
          quantity: line.quantity,
        }))}
        onCartItemRemove={remove}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route
          path="*"
          element={
            <main className="commerce-page">
              <h1>Page not found.</h1>
              <Link to="/">Return home</Link>
            </main>
          }
        />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <StoreApp />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
