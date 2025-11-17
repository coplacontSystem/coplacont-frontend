type CloseIconProps = React.SVGProps<SVGSVGElement>;

export const CloseIcon: React.FC<CloseIconProps> = (props) => {
  return (
    <svg
      width="13"
      height="12"
      viewBox="0 0 13 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.5 3L3.5 9M3.5 3L9.5 9"
        stroke="#F74747"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
