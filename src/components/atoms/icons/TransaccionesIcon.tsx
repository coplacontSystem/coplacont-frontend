import { useContext } from 'react';
import { ThemeContext } from '../../../shared/context/ThemeContext';

type IconProps = React.SVGProps<SVGSVGElement>;

export const TransaccionesIcon: React.FC<IconProps> = (props) => {
  const { theme } = useContext(ThemeContext);
  const fillColor = theme === 'dark' ? '#fff' : '#1F1F1F';
  
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
        d="M6.66667 14.0001H12.6667C13.0203 14.0001 13.3594 13.8596 13.6095 13.6096C13.8595 13.3595 14 13.0204 14 12.6667V11.3334H6.66667V14.0001ZM6.66667 10.0001H14V6.66675H6.66667V10.0001ZM5.33333 6.66675V10.0001H2V6.66675H5.33333ZM6.66667 5.33341H14V4.00008C14 3.64646 13.8595 3.30732 13.6095 3.05727C13.3594 2.80722 13.0203 2.66675 12.6667 2.66675H6.66667V5.33341ZM5.33333 2.66675V5.33341H2V4.00008C2 3.64646 2.14048 3.30732 2.39052 3.05727C2.64057 2.80722 2.97971 2.66675 3.33333 2.66675H5.33333ZM5.33333 11.3334V14.0001H3.33333C2.97971 14.0001 2.64057 13.8596 2.39052 13.6096C2.14048 13.3595 2 13.0204 2 12.6667V11.3334H5.33333Z"
        fill={fillColor}
      />
    </svg>
  );
};
