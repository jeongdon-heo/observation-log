interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function EmptyState({ icon = "📝", title, description, children }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-gray-700 font-medium mb-1">{title}</h3>
      {description && <p className="text-gray-400 text-sm mb-4">{description}</p>}
      {children}
    </div>
  );
}
