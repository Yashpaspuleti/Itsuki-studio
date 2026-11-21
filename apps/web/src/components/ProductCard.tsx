import { useState } from "react";
import { ChevronRight, Check, Sparkles, Leaf, Sun } from "lucide-react";
import type { Product } from "../data/products";
import { formatPrice } from "../data/products";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAdd = () => {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const features = [
    { icon: Sparkles, label: "Thoughtful design" },
    { icon: Leaf, label: "Considered materials" },
    { icon: Sun, label: "Warm ambience" },
  ];

  return (
    <article className="product-card" data-product-id={product.id}>
      <div className="product-image-wrapper">
        {imageError ? (
          <div
            className="product-image-placeholder loading-skeleton"
            style={{ width: "100%", height: "100%" }}
            aria-hidden="true"
          />
        ) : (
          <img
            src={product.image}
            alt={product.alt}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}
        {product.id === "wave-lamp" && (
          <span className="product-badge product-badge--gold">New</span>
        )}
      </div>

      <div className="product-info">
        <div>
          <h3 className="product-name">{product.name}</h3>
          <p className="product-tagline">{product.tagline}</p>
          <span className="product-price">{formatPrice(product.pricePaise)}</span>
        </div>

        <button
          className={`btn-add-to-cart ${added ? "added" : ""}`}
          onClick={handleAdd}
          disabled={added}
          aria-label={added ? `${product.name} added to bag` : `Add ${product.name} to bag`}
          aria-pressed={added}
        >
          {added ? (
            <>
              <Check size={16} />
              <span>Added</span>
            </>
          ) : (
            <>
              <span>Add to bag</span>
              <ChevronRight size={16} />
            </>
          )}
        </button>

        {added && (
          <span role="status" aria-live="polite">
            1 piece in your bag
          </span>
        )}

        <div className="product-features" role="list" aria-label="Product features">
          {features.map((feature, index) => (
            <span key={index} className="feature-tag" role="listitem">
              <feature.icon size={12} aria-hidden="true" />
              {feature.label}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}