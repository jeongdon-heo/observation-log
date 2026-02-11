interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, className = "", onClick, hover = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border ${hover ? "hover:shadow-md cursor-pointer transition" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
