import React from 'react';

interface ButtonGridProps {
  items: Array<{
    id: string;
    name: string;
    price?: number;
    count?: number;
    color?: string;
    disabled?: boolean;
  }>;
  onItemClick: (id: string) => void;
  columns?: number;
  showPrice?: boolean;
  showCount?: boolean;
}

const ButtonGrid: React.FC<ButtonGridProps> = ({ 
  items, 
  onItemClick, 
  columns = 3,
  showPrice = false,
  showCount = false
}) => {
  const getButtonClass = (color?: string, disabled?: boolean) => {
    if (disabled) return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    
    switch (color) {
      case 'revenue': return 'btn-revenue';
      case 'expense': return 'btn-expense';
      case 'employee': return 'btn-employee';
      case 'inventory': return 'btn-inventory';
      case 'report': return 'btn-report';
      default: return 'btn-primary';
    }
  };

  return (
    <div 
      className={`grid gap-4`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => !item.disabled && onItemClick(item.id)}
          disabled={item.disabled}
          className={`${getButtonClass(item.color, item.disabled)} min-h-24 flex flex-col items-center justify-center text-center p-4`}
        >
          <span className="font-semibold text-lg mb-1">{item.name}</span>
          {showPrice && item.price && (
            <span className="text-sm opacity-90">€{item.price.toFixed(2)}</span>
          )}
          {showCount && item.count !== undefined && (
            <span className="text-sm opacity-90">Sold: {item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ButtonGrid;