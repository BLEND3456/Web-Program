const Button = ({ children, onClick, variant = 'primary', className = '', ...rest }) => {
    const base = 'px-4 py-2 rounded text-sm font-medium transition-colors';
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      success: 'bg-green-600 text-white hover:bg-green-700',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };
  
    return (
      <button
        onClick={onClick}
        className={`${base} ${variants[variant] || variants.primary} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  };
  
  export default Button;