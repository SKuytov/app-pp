import React from 'react';
import { Card } from '@/components/ui/card';
import { useCurrency } from '@/contexts/CurrencyContext';

const StatCard = ({ label, value, icon: Icon, color, isCurrency = false }) => {
  const { currency } = useCurrency();
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-200 text-blue-400',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-200 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-200 text-purple-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-200 text-red-400',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-200 text-yellow-400',
    cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-200 text-cyan-400',
  };

  const classes = colorClasses[color] || colorClasses.blue;
  const [bgClass, borderClass, textLabelClass, textIconClass] = classes.split(' ');

  const formatValue = () => {
    if (!isCurrency) return value;
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return value;

    if (currency === 'BGN') {
      return `${numberValue.toFixed(2)} BGN`;
    }
    return `$${numberValue.toFixed(2)}`;
  };


  return (
    <Card className={`p-4 bg-gradient-to-br ${bgClass} backdrop-blur-sm ${borderClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${textLabelClass} text-sm font-medium`}>{label}</p>
          <p className="text-2xl font-bold text-white">{formatValue()}</p>
        </div>
        <Icon className={`h-10 w-10 ${textIconClass}`} />
      </div>
    </Card>
  );
};

export default StatCard;