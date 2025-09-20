import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'revenue' | 'expense' | 'employee' | 'inventory' | 'report' | 'neutral';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'neutral',
  subtitle,
  trend
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'revenue':
        return 'border-revenue-200 bg-revenue-50 text-revenue-900';
      case 'expense':
        return 'border-expense-200 bg-expense-50 text-expense-900';
      case 'employee':
        return 'border-employee-200 bg-employee-50 text-employee-900';
      case 'inventory':
        return 'border-inventory-200 bg-inventory-50 text-inventory-900';
      case 'report':
        return 'border-report-200 bg-report-50 text-report-900';
      default:
        return 'border-gray-200 bg-white text-gray-900';
    }
  };

  const getIconColor = () => {
    switch (color) {
      case 'revenue': return 'text-revenue-600';
      case 'expense': return 'text-expense-600';
      case 'employee': return 'text-employee-600';
      case 'inventory': return 'text-inventory-600';
      case 'report': return 'text-report-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`card border-2 ${getColorClasses()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {Icon && <Icon className={`h-5 w-5 mr-2 ${getIconColor()}`} />}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          
          <div className="text-2xl md:text-3xl font-bold mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
          
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;