import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { apiRequest } from "../lib/api";
import { formatPrice, products, type Product } from "../data/products";
import { useAuth, useCart } from "../context/store";

type OrderItem = {
  id: string;
  quantity: number;
  unitPricePaise: number;
  product: { name: string; imageUrl: string; slug: string };
};
type Order = {
  id: string;
  status: string;
  totalPaise: number;
  createdAt: string;
  items: OrderItem[];
};
function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="form-notice" role="alert">
      {children}
    </p>
  );
}

export function ProductPage() {
  const { slug = "" } = useParams();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(
    () => products.find((item) => item.slug === slug) ?? null,
  );
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    setMissing(false);
    apiRequest<{
      product: {
        id: string;
        slug: string;
        name: string;
        description: string;
        pricePaise: number;
        imageUrl: string;
      };
    }>(`/products/${slug}`)
      .then(({ product: remote }) =>
        setProduct({
          ...remote,
          tagline:
            remote.slug === "wave-lamp"
              ? "Soft curves. Gentle glow."
              : "Bold patterns. Warm light.",
          image: remote.imageUrl,
          alt: `${remote.name} by Itsuki Studio`,
          details: [
            "Thoughtfully designed form",
            "Warm ambient lighting",
            "Made for considered spaces",
          ],
        }),
      )
      .catch(() => {
        if (!products.some((item) => item.slug === slug)) setMissing(true);
      });
  }, [slug]);
  if (!product && !missing)
    return (
      <main className="commerce-page">
        <p>Loading product…</p>
      </main>
    );
  if (!product || missing)
    return (
      <main className="commerce-page">
        <h1>We couldn't find that lamp.</h1>
        <Link className="primary-button" to="/">
          Back to the collection
        </Link>
      </main>
    );
  return (
    <main className="commerce-page product-detail-page">
      <nav className="breadcrumbs">
        <Link to="/">Home</Link> / <Link to="/#collection">Collection</Link> /{" "}
        {product.name}
      </nav>
      <div className="product-detail-grid">
        <div className="detail-photo">
          <img src={product.image} alt={product.alt} />
          <span className="photo-caption">
            Designed and made in small batches
          </span>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">ITSUKI STUDIO · THE COLLECTION</p>
          <h1>{product.name}</h1>
          <p className="detail-tagline">{product.tagline}</p>
          <strong className="detail-price">
            {formatPrice(product.pricePaise)}
          </strong>
          <p>{product.description}</p>
          <ul>
            {product.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <p className="stock-note">
            <span /> Made in small batches · Please check availability at
            checkout
          </p>
          <button className="primary-button" onClick={() => add(product)}>
            Add to bag <ArrowRight size={17} />
          </button>
          <p className="detail-assurance">
            <ShieldCheck size={17} /> Secure checkout · Carefully packed ·
            Customer support
          </p>
        </div>
      </div>
    </main>
  );
}

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user) navigate("/account");
  }, [user, navigate]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "login")
        await signIn(String(data.get("email")), String(data.get("password")));
      else
        await signUp({
          name: String(data.get("name")),
          email: String(data.get("email")),
          password: String(data.get("password")),
          phone: String(data.get("phone") || ""),
        });
      navigate("/account");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="commerce-page auth-page">
      <section className="auth-card">
        <p className="eyebrow">WELCOME TO ITSUKI</p>
        <h1>{mode === "login" ? "Welcome back." : "Create your account."}</h1>
        <p>Keep your orders and details together.</p>
        <form onSubmit={submit} className="stack-form">
          {mode === "register" && (
            <label>
              Full name
              <input name="name" minLength={2} required autoComplete="name" />
            </label>
          )}
          <label>
            Email address
            <input name="email" type="email" required autoComplete="email" />
          </label>
          {mode === "register" && (
            <label>
              Phone (optional)
              <input name="phone" type="tel" autoComplete="tel" />
            </label>
          )}
          <label>
            Password
            <input
              name="password"
              type="password"
              minLength={mode === "register" ? 10 : 1}
              required
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
            {mode === "register" && <small>Use at least 10 characters.</small>}
          </label>
          {error && <Notice>{error}</Notice>}
          <button className="primary-button" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}{" "}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="auth-switch">
          {mode === "login"
            ? "New to Itsuki Studio?"
            : "Already have an account?"}{" "}
          <Link to={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </section>
    </main>
  );
}

export function CartPage() {
  const { items, totalPaise, setQuantity, remove } = useCart();
  return (
    <main className="commerce-page">
      <p className="eyebrow">YOUR SELECTION</p>
      <h1>Your shopping bag.</h1>
      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your bag is waiting for a little light.</p>
          <Link className="primary-button" to="/#collection">
            Explore the collection
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {items.map(({ product, quantity }) => (
              <article className="cart-line" key={product.id}>
                <img src={product.image} alt={product.alt} />
                <div>
                  <h2>{product.name}</h2>
                  <p>{formatPrice(product.pricePaise)}</p>
                  <div className="quantity-control">
                    <button
                      aria-label={`Decrease ${product.name} quantity`}
                      onClick={() => setQuantity(product.id, quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{quantity}</span>
                    <button
                      aria-label={`Increase ${product.name} quantity`}
                      onClick={() => setQuantity(product.id, quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <button
                  className="icon-quiet"
                  aria-label={`Remove ${product.name}`}
                  onClick={() => remove(product.id)}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
          <aside className="summary-card">
            <h2>Order summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>{formatPrice(totalPaise)}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <hr />
            <div className="summary-total">
              <span>Total</span>
              <strong>{formatPrice(totalPaise)}</strong>
            </div>
            <Link className="primary-button full-button" to="/checkout">
              Continue to checkout <ArrowRight size={16} />
            </Link>
            <p>Secure payment powered by Razorpay.</p>
          </aside>
        </div>
      )}
    </main>
  );
}

type Shipping = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function CheckoutPage() {
  const { items, totalPaise, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!user) {
      navigate("/login");
      return;
    }
    if (!items.length) return;
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const shipping: Shipping = {
      name: String(data.get("name")),
      phone: String(data.get("phone")),
      line1: String(data.get("line1")),
      line2: String(data.get("line2") || ""),
      city: String(data.get("city")),
      state: String(data.get("state")),
      postalCode: String(data.get("postalCode")),
    };
    try {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Unable to load secure checkout."));
      });
      const order = await apiRequest<{
        orderId: string;
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }>("/payments/razorpay/order", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
          })),
          shipping,
        }),
      });
      if (!window.Razorpay)
        throw new Error("Secure payment checkout is unavailable.");
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Itsuki Studio",
        description: "Thoughtfully designed lighting",
        order_id: order.razorpayOrderId,
        prefill: {
          name: shipping.name,
          email: user.email,
          contact: shipping.phone,
        },
        theme: { color: "#c49a4a" },
        handler: async (response: Record<string, string>) => {
          try {
            await apiRequest("/payments/razorpay/verify", {
              method: "POST",
              body: JSON.stringify(response),
            });
            clear();
            navigate("/orders?success=1");
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Payment verification is pending. Check your order history.",
            );
          }
        },
      });
      checkout.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start checkout.");
    } finally {
      setBusy(false);
    }
  }
  if (!items.length)
    return (
      <main className="commerce-page">
        <h1>Your bag is empty.</h1>
        <Link to="/#collection">Return to the collection</Link>
      </main>
    );
  return (
    <main className="commerce-page">
      <p className="eyebrow">SECURE CHECKOUT</p>
      <h1>Where should we send it?</h1>
      <div className="checkout-layout">
        <form className="stack-form checkout-form" onSubmit={submit}>
          <h2>Delivery details</h2>
          <div className="form-two">
            <label>
              Full name
              <input
                name="name"
                defaultValue={user?.name ?? ""}
                required
                minLength={2}
              />
            </label>
            <label>
              Phone number
              <input name="phone" type="tel" required minLength={8} />
            </label>
          </div>
          <label>
            Address line 1<input name="line1" required minLength={4} />
          </label>
          <label>
            Address line 2 (optional)
            <input name="line2" />
          </label>
          <div className="form-two">
            <label>
              City
              <input name="city" required />
            </label>
            <label>
              State
              <input name="state" required />
            </label>
          </div>
          <label>
            PIN code
            <input
              name="postalCode"
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
            />
          </label>
          {error && <Notice>{error}</Notice>}
          <button className="primary-button" disabled={busy}>
            {busy ? "Preparing secure payment…" : "Pay securely"}{" "}
            <ArrowRight size={16} />
          </button>
          <p className="form-help">
            You'll complete payment on Razorpay's secure checkout. Itsuki Studio
            never receives or stores card or UPI credentials.
          </p>
        </form>
        <aside className="summary-card">
          <h2>Your order</h2>
          {items.map(({ product, quantity }) => (
            <div className="checkout-item" key={product.id}>
              <span>
                {product.name} × {quantity}
              </span>
              <strong>{formatPrice(product.pricePaise * quantity)}</strong>
            </div>
          ))}
          <hr />
          <div className="summary-total">
            <span>Total</span>
            <strong>{formatPrice(totalPaise)}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    apiRequest<{ orders: Order[] }>("/orders")
      .then((data) => setOrders(data.orders))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load orders."),
      );
  }, []);
  return (
    <main className="commerce-page">
      <p className="eyebrow">YOUR ITSUKI ACCOUNT</p>
      <h1>Order history.</h1>
      {error && <Notice>{error}</Notice>}
      {orders.length === 0 && !error ? (
        <div className="empty-state">
          <p>
            No orders yet. Your first favorite might be waiting in the
            collection.
          </p>
          <Link className="primary-button" to="/#collection">
            Explore lamps
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card-head">
                <div>
                  <small>ORDER PLACED</small>
                  <strong>
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </strong>
                </div>
                <div>
                  <small>ORDER TOTAL</small>
                  <strong>{formatPrice(order.totalPaise)}</strong>
                </div>
                <span
                  className={`status-pill status-${order.status.toLowerCase()}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="order-items">
                {order.items.map((item) => (
                  <div key={item.id}>
                    <img src={item.product.imageUrl} alt="" />
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <small>Order reference: {order.id}</small>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export function AccountPage() {
  const { user, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await apiRequest("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: data.get("name"),
          phone: data.get("phone"),
        }),
      });
      await refresh();
      setMessage("Your details have been updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update profile.");
    }
  }
  if (!user)
    return (
      <main className="commerce-page">
        <h1>Please sign in.</h1>
        <Link className="primary-button" to="/login">
          Sign in
        </Link>
      </main>
    );
  return (
    <main className="commerce-page">
      <p className="eyebrow">YOUR ITSUKI ACCOUNT</p>
      <h1>Hello, {user.name.split(" ")[0]}.</h1>
      <div className="account-grid">
        <form className="stack-form account-card" onSubmit={save}>
          <h2>Personal details</h2>
          <label>
            Name
            <input
              name="name"
              defaultValue={user.name}
              required
              minLength={2}
            />
          </label>
          <label>
            Email
            <input value={user.email} disabled readOnly />
          </label>
          <label>
            Phone
            <input name="phone" defaultValue={user.phone ?? ""} />
          </label>
          {message && <p className="success-note">{message}</p>}
          {error && <Notice>{error}</Notice>}
          <button className="primary-button">Save changes</button>
        </form>
        <section className="account-card">
          <h2>Orders & account</h2>
          <p>Keep track of your Itsuki purchases and delivery progress.</p>
          <Link className="outline-button" to="/orders">
            View order history <ArrowRight size={15} />
          </Link>
          <button
            className="text-button"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            Sign out
          </button>
          {user.role === "ADMIN" && (
            <Link className="outline-button" to="/admin">
              Open admin dashboard
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}

export function AdminPage() {
  const [overview, setOverview] = useState<{
    products: number;
    orders: number;
    customers: number;
    revenuePaise: number;
  } | null>(null);
  const [inventory, setInventory] = useState<
    Array<{
      id: string;
      name: string;
      stock: number;
      pricePaise: number;
      active: boolean;
    }>
  >([]);
  type AdminOrder = {
    id: string;
    status: string;
    totalPaise: number;
    createdAt: string;
    user: { name: string; email: string };
  };
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  useEffect(() => {
    Promise.all([
      apiRequest<typeof overview>("/admin/overview"),
      apiRequest<{ products: typeof inventory }>("/admin/products"),
      apiRequest<{ orders: AdminOrder[] }>("/admin/orders"),
    ])
      .then(([stats, data, orderData]) => {
        setOverview(stats);
        setInventory(data.products);
        setOrders(orderData.orders);
      })
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Administrator access required.",
        ),
      );
  }, []);
  async function updateStock(id: string, stock: number) {
    setBusyId(id);
    try {
      await apiRequest(`/admin/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ stock }),
      });
      setInventory((current) =>
        current.map((product) =>
          product.id === id ? { ...product, stock } : product,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update inventory.");
    } finally {
      setBusyId("");
    }
  }
  async function updateStatus(id: string, status: string) {
    try {
      await apiRequest(`/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) =>
        current.map((order) =>
          order.id === id ? { ...order, status } : order,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update order.");
    }
  }
  return (
    <main className="commerce-page admin-page">
      <p className="eyebrow">ITSUKI STUDIO · ADMIN</p>
      <h1>Studio overview.</h1>
      {error && <Notice>{error}</Notice>}
      {overview && (
        <div className="admin-stats">
          <div>
            <small>PRODUCTS</small>
            <strong>{overview.products}</strong>
          </div>
          <div>
            <small>ORDERS</small>
            <strong>{overview.orders}</strong>
          </div>
          <div>
            <small>CUSTOMERS</small>
            <strong>{overview.customers}</strong>
          </div>
          <div>
            <small>REVENUE</small>
            <strong>{formatPrice(overview.revenuePaise)}</strong>
          </div>
        </div>
      )}
      <section className="inventory-panel">
        <h2>Inventory</h2>
        <div className="inventory-table">
          <div className="inventory-row inventory-head">
            <span>Product</span>
            <span>Price</span>
            <span>Available stock</span>
            <span>Visibility</span>
          </div>
          {inventory.map((product) => (
            <div className="inventory-row" key={product.id}>
              <strong>{product.name}</strong>
              <span>{formatPrice(product.pricePaise)}</span>
              <label className="stock-input">
                <input
                  aria-label={`${product.name} stock`}
                  type="number"
                  min="0"
                  value={product.stock}
                  onChange={(event) =>
                    setInventory((current) =>
                      current.map((item) =>
                        item.id === product.id
                          ? { ...item, stock: Number(event.target.value) }
                          : item,
                      ),
                    )
                  }
                  onBlur={(event) =>
                    void updateStock(product.id, Number(event.target.value))
                  }
                />
                {busyId === product.id && " Saving…"}
              </label>
              <span>{product.active ? "Published" : "Hidden"}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="inventory-panel admin-orders">
        <h2>Recent orders</h2>
        {orders.length === 0 ? (
          <p>No orders have been placed yet.</p>
        ) : (
          orders.map((order) => (
            <div className="admin-order-row" key={order.id}>
              <div>
                <strong>{order.user.name}</strong>
                <small>
                  {order.user.email} ·{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </small>
                <small>#{order.id}</small>
              </div>
              <strong>{formatPrice(order.totalPaise)}</strong>
              <select
                aria-label={`Status for order ${order.id}`}
                value={order.status}
                onChange={(event) =>
                  void updateStatus(order.id, event.target.value)
                }
              >
                {order.status === "PAID" && <option value="PAID">PAID</option>}
                {order.status === "PAID" && (
                  <option value="PROCESSING">PROCESSING</option>
                )}
                {order.status === "PROCESSING" && (
                  <>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                  </>
                )}
                {order.status === "SHIPPED" && (
                  <>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </>
                )}
                {order.status === "DELIVERED" && (
                  <option value="DELIVERED">DELIVERED</option>
                )}
              </select>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
