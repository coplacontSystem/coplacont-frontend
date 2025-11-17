import { useContext } from 'react';
import { ThemeContext } from '../../../shared/context/ThemeContext';

type IconProps = React.SVGProps<SVGSVGElement>;

export const CierreContableIcon: React.FC<IconProps> = (props) => {
  const { theme } = useContext(ThemeContext);
  const strokeColor = theme === 'dark' ? '#fff' : '#1F1F1F';
  
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.66667 2.66659V13.3333C2.66667 13.6869 2.80714 14.026 3.05719 14.2761C3.30724 14.5261 3.64638 14.6666 4 14.6666H12C12.3536 14.6666 12.6928 14.5261 12.9428 14.2761C13.1929 14.026 13.3333 13.6869 13.3333 13.3333V5.56125C13.3333 5.38362 13.2978 5.20779 13.2289 5.04408C13.16 4.88037 13.059 4.73208 12.932 4.60792L9.972 1.71325C9.72291 1.46969 9.38838 1.3333 9.04 1.33325H4C3.64638 1.33325 3.30724 1.47373 3.05719 1.72378C2.80714 1.97382 2.66667 2.31296 2.66667 2.66659Z"
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.33334 1.33325V3.99992C9.33334 4.35354 9.47381 4.69268 9.72386 4.94273C9.97391 5.19278 10.313 5.33325 10.6667 5.33325H13.3333"
        stroke={strokeColor}
        strokeLinejoin="round"
      />
    </svg>
  );
};
