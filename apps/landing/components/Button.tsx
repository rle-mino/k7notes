import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  // Increased border-radius to rounded-full for friendlier look
  const baseStyles = "inline-flex items-center justify-center px-8 py-4 border text-base font-bold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 transform active:scale-95";
  
  const variants = {
    primary: "border-transparent text-white bg-arch-black hover:bg-gray-800 focus:ring-gray-900 shadow-lg hover:shadow-xl",
    secondary: "border-transparent text-white bg-safety-orange hover:bg-orange-600 focus:ring-orange-500 shadow-lg hover:shadow-xl",
    outline: "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-200 hover:border-gray-300 shadow-sm"
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;