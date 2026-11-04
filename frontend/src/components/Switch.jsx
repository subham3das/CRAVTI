/**
 * Accessible, pixel-perfect Switch Toggle (ui-ux-pro-max standard)
 */
export const Switch = ({
  checked = false,
  onChange,
  disabled = false,
  size = 'md', // 'sm' | 'md'
  className = '',
  id,
  title,
  'aria-label': ariaLabel,
}) => {
  const isSm = size === 'sm';

  const handleClick = (e) => {
    e.stopPropagation();
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      title={title || (checked ? 'Active' : 'Disabled')}
      aria-checked={checked}
      aria-label={ariaLabel || (checked ? 'Active' : 'Disabled')}
      disabled={disabled}
      onClick={handleClick}
      className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 ${
        isSm ? 'h-5 w-9 p-0.5' : 'h-6 w-11 p-0.5'
      } ${
        checked ? 'bg-[#16A34A]' : 'bg-slate-200 hover:bg-slate-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transform transition-transform duration-200 ease-in-out ${
          isSm ? 'h-4 w-4' : 'h-5 w-5'
        } ${
          isSm
            ? checked ? 'translate-x-4' : 'translate-x-0'
            : checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export default Switch;

