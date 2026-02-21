// src/components/ui/Card.tsx
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardRounded = 'md' | 'lg' | 'xl' | '2xl' | '3xl';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    padding?: CardPadding;
    rounded?: CardRounded;
    hoverable?: boolean;
    gradient?: boolean;
    gradientColors?: string;
    border?: boolean;
    children: React.ReactNode;
}

const paddingStyles: Record<CardPadding, string> = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
};

const roundedStyles: Record<CardRounded, string> = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-[2rem]'
};

const Card: React.FC<CardProps> = ({
    padding = 'md',
    rounded = '2xl',
    hoverable = false,
    gradient = false,
    gradientColors = 'from-blue-600 to-indigo-700',
    border = true,
    children,
    className = '',
    ...props
}) => {
    const baseStyles = gradient
        ? `bg-gradient-to-br ${gradientColors} text-white`
        : 'bg-white ';

    const borderStyles = border && !gradient
        ? 'border border-gray-100 '
        : '';

    return (
        <motion.div
            whileHover={hoverable ? { scale: 1.01, y: -2 } : undefined}
            whileTap={hoverable ? { scale: 0.99 } : undefined}
            className={`
        ${baseStyles}
        ${paddingStyles[padding]}
        ${roundedStyles[rounded]}
        ${borderStyles}
        ${hoverable ? 'cursor-pointer hover:shadow-xl' : ''}
        shadow-sm transition-all duration-300
        ${className}
      `}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
