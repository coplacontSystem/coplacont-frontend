import { useContext } from 'react';
import { ThemeContext } from '../../../shared/context/ThemeContext';

type LogoutIconProps = React.SVGProps<SVGSVGElement>;

export const CerrarSesionIcon: React.FC<LogoutIconProps> = (props) => {
  const { theme } = useContext(ThemeContext);
  const strokeColor = theme === 'dark' ? '#fff' : '#1F1F1F';
  
  return (
  <svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6"
      stroke={strokeColor}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
  );
};
