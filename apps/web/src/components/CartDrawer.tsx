import { ChevronRight, ShoppingBag, X } from "lucide-react";
import type { Product } from "../data/products";
import { formatPrice } from "../data/products";

export type CartItem = Product & { quantity: number };

type CartDrawerProps = {
  open: boolean;
  cart: CartItem[];
  cartCount: number;
  onClose: () => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
};

export function CartDrawer({
  open,
  cart,
  cartCount,
  onClose,
  onRemove,
  onCheckout,
}: CartDrawerProps) {
  const total = cart.reduce(
    (sum, item) => sum + item.pricePaise * item.quantity,
    0,
  );

  return (
    <>
      {open && (
        <button
          type="button"
          className="cart-drawer-overlay visible"
          onClick={onClose}
          aria-label="Close shopping bag"
          tabIndex={-1}
        />
      )}

      <aside
        id="cart-drawer"
        className={`cart-drawer ${open ? "open" : ""}`}
        role="dialog"
        aria-label="Shopping bag"
        aria-modal="true"
        aria-hidden={!open}
      >
        <header className="cart-drawer-header">
          <div>
            <p className="cart-drawer-kicker">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </p>
            <h2 className="cart-drawer-title">Your Bag</h2>
          </div>
          <button
            type="button"
            className="cart-drawer-close"
            aria-label="Close bag"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        <div className="cart-drawer-content">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon" aria-hidden="true">
                <ShoppingBag size={30} />
              </div>
              <p className="cart-empty-title">Your bag is empty</p>
              <p className="cart-empty-copy">
                Explore the collection and add a piece you love.
              </p>
            </div>
          ) : (
            <ul className="cart-list" role="list">
              {cart.map((item) => (
                <li key={item.id} className="cart-item">
                  <img
                    src={item.image}
                    alt=""
                    className="cart-item-image"
                    aria-hidden="true"
                    loading="lazy"
                  />
                  <div className="cart-item-details">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-meta">Qty {item.quantity}</span>
                    <span className="cart-item-price">
                      {formatPrice(item.pricePaise * item.quantity)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="cart-item-remove"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <X size={17} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <footer className="cart-drawer-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Subtotal</span>
              <span className="cart-total-value">{formatPrice(total)}</span>
            </div>
            <button
              type="button"
              className="checkout-button"
              onClick={() => {
                onClose();
                onCheckout();
              }}
            >
              Proceed to checkout
              <ChevronRight size={18} />
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
