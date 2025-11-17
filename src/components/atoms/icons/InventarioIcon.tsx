import { useContext } from 'react';
import { ThemeContext } from '../../../shared/context/ThemeContext';

type IconProps = React.SVGProps<SVGSVGElement>;

export const InventarioIcon: React.FC<IconProps> = (props) => {
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
        d="M14 4.66667V12.4C14 13.2867 13.2867 14 12.4 14H3.6C2.71333 14 2 13.2867 2 12.4V4.66667M5.33333 7.33333H10.6667M1.73333 2H14.2667C14.5496 2 14.8209 2.11238 15.0209 2.31242C15.221 2.51246 15.3333 2.78377 15.3333 3.06667V3.6C15.3333 3.74008 15.3057 3.87878 15.2521 4.0082C15.1985 4.13761 15.12 4.2552 15.0209 4.35425C14.9219 4.4533 14.8043 4.53187 14.6749 4.58547C14.5454 4.63908 14.4067 4.66667 14.2667 4.66667H1.73333C1.45044 4.66667 1.17913 4.55429 0.979087 4.35425C0.779049 4.15421 0.666668 3.8829 0.666668 3.6V3.06667C0.666668 2.92659 0.694258 2.78788 0.747863 2.65847C0.801468 2.52906 0.880038 2.41147 0.979087 2.31242C1.17913 2.11238 1.45044 2 1.73333 2Z"
        stroke={strokeColor}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
