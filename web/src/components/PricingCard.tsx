interface PricingCardProps {
  name: string;
  price: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  badge?: string;
  highlighted?: boolean;
  disabled?: boolean;
}

export function PricingCard({
  name,
  price,
  features,
  buttonText,
  buttonLink,
  badge,
  highlighted = false,
  disabled = false,
}: PricingCardProps) {
  return (
    <div
      className={`relative bg-mv-surface border rounded-xl p-6 transition-all duration-300 ${
        highlighted
          ? 'border-mv-accent shadow-lg shadow-mv-accent/10 scale-105'
          : 'border-mv-border hover:border-mv-accent/50'
      }`}
    >
      {badge && (
        <span
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full ${
            badge === 'B2B'
              ? 'bg-mv-surface-2 text-mv-text-secondary border border-mv-border'
              : 'bg-mv-accent text-white'
          }`}
        >
          {badge}
        </span>
      )}

      <h3 className="text-xl font-bold text-mv-text mb-2">{name}</h3>
      <div className="text-3xl font-bold text-mv-accent mb-6">{price}</div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-mv-text-secondary">
            <span className="text-mv-real mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href={buttonLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`block w-full py-3 text-center rounded-lg font-medium transition-all ${
          disabled
            ? 'bg-mv-surface-2 text-mv-text-muted cursor-not-allowed'
            : highlighted
            ? 'bg-mv-accent text-white hover:bg-mv-accent-hover'
            : 'bg-mv-surface-2 border border-mv-border text-mv-text hover:border-mv-accent'
        }`}
      >
        {buttonText}
      </a>
    </div>
  );
}
