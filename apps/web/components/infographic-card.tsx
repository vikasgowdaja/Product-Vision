/**
 * Infographic preview card component.
 * Renders SVG/PNG infographic with LinkedIn caption preview.
 */
interface InfographicCardProps {
  title: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  scheduledAt?: string;
  status: 'draft' | 'scheduled' | 'published';
}

export function InfographicCard({
  title,
  imageUrl,
  caption,
  hashtags,
  scheduledAt,
  status,
}: InfographicCardProps) {
  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-blue-100 text-blue-800',
    published: 'bg-green-100 text-green-800',
  };

  return (
    <article className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
      {/* Infographic Preview */}
      <div className="aspect-square bg-gray-100 relative">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Generating...
          </div>
        )}
        <span
          className={`absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-full ${statusColors[status]}`}
        >
          {status}
        </span>
      </div>

      {/* Details */}
      <div className="p-4 space-y-2">
        <h4 className="font-semibold text-sm truncate">{title}</h4>
        <p className="text-xs text-gray-500 line-clamp-2">{caption}</p>
        <div className="flex flex-wrap gap-1">
          {hashtags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs text-blue-600">
              {tag}
            </span>
          ))}
        </div>
        {scheduledAt && (
          <p className="text-xs text-gray-400">
            Scheduled: {new Date(scheduledAt).toLocaleString()}
          </p>
        )}
      </div>
    </article>
  );
}
