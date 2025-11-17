import { useContext } from 'react';
import { ThemeContext } from '../../../shared/context/ThemeContext';

type IconProps = React.SVGProps<SVGSVGElement>;

export const EstadosFinancierosIcon: React.FC<IconProps> = (props) => {
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
        d="M0 14.8281L3 11.8281V16H0V14.8281ZM4 10.8281L7 7.82812V16H4V10.8281ZM14 7H15V16H12V8.82812L14 7ZM10.5 10.3281L11 9.82812V16H8V7.82812L10.5 10.3281ZM16 2V6H15V3.71094L10.5 8.20312L7.5 5.20312L0 12.7109V11.2891L7.5 3.79688L10.5 6.79688L14.2891 3H12V2H16Z"
        fill={fillColor}
      />
    </svg>
  );
};
