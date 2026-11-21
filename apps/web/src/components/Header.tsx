import { useEffect, useRef, useState } from "react";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { CartDrawer, type CartItem } from "./CartDrawer";
import { formatPrice } from "../data/products";
import iconURL from "../../public/images/itsuki-studio-is-icon.svg";
import { Link } from "react-router-dom";
import { useAuth } from "../context/store";

type HeaderProps = {
  cartCount?: number;
  cart?: CartItem[];
  onCartItemRemove?: (productId: string) => void;
  onCheckout?: () => void;
  isCartOpen?: boolean;
  onCartToggle?: (open: boolean) => void;
};

export function Header({
  cartCount = 0,
  cart = [],
  onCartItemRemove,
  onCheckout,
  isCartOpen = false,
  onCartToggle,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const total = cart.reduce(
    (sum, item) => sum + item.pricePaise * item.quantity,
    0,
  );

  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCartToggle?.(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCartToggle]);

  return (
    <>
      <header
        ref={headerRef}
        className={`site-header ${scrolled ? "scrolled" : ""}`}
        role="banner"
      >
        <a className="brand" href="#home" aria-label="Itsuki Studio home">
          <img className="brand-mark" src={iconURL} alt="" aria-hidden="true" />
          <span>Itsuki Studio</span>
        </a>

        <button
          className="mobile-menu-button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav
          id="main-navigation"
          className={`main-nav ${menuOpen ? "open" : ""}`}
          aria-label="Main navigation"
        >
          <a href="#collection" onClick={() => setMenuOpen(false)}>
            Shop
          </a>
          <a href="#story" onClick={() => setMenuOpen(false)}>
            About
          </a>
          <a href="#journal" onClick={() => setMenuOpen(false)}>
            Journal
          </a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>
            Contact
          </a>
        </nav>

        <div className="header-actions">
          <button
            aria-label="Search"
            className="icon-button"
            onClick={() => {
              document.getElementById("email")?.focus();
            }}
          >
            <Search />
          </button>

          <div className="bag-menu">
            <button
              type="button"
              aria-label={`Shopping bag, ${cartCount} items, total ${formatPrice(total)}`}
              aria-expanded={isCartOpen}
              aria-controls="cart-drawer"
              className="icon-button bag-button"
              onClick={() => onCartToggle?.(!isCartOpen)}
            >
              <ShoppingBag />
              {cartCount > 0 && <span className="bag-count">{cartCount}</span>}
            </button>
          </div>

          <div className="account-menu">
            <Link
              to={user ? "/account" : "/login"}
              onClick={() => setMenuOpen(false)}
            >
              <UserRound />
              {user ? "Account" : "Login"}
            </Link>
          </div>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="mobile-menu-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <CartDrawer
        open={isCartOpen}
        cart={cart}
        cartCount={cartCount}
        onClose={() => onCartToggle?.(false)}
        onRemove={(productId) => onCartItemRemove?.(productId)}
        onCheckout={() => onCheckout?.()}
      />
    </>
  );
}
