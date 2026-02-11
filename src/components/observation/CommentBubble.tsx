import type { Comment } from "@/types";

interface CommentBubbleProps {
  comment: Comment;
}

const authorStyles = {
  ai: {
    bg: "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100",
    badge: "bg-purple-400",
    nameColor: "text-purple-600",
  },
  student: {
    bg: "bg-gray-50 border-gray-100",
    badge: "bg-green-400",
    nameColor: "text-green-600",
  },
  teacher: {
    bg: "bg-blue-50 border-blue-100",
    badge: "bg-blue-400",
    nameColor: "text-blue-600",
  },
};

export default function CommentBubble({ comment }: CommentBubbleProps) {
  const style = authorStyles[comment.authorType];

  return (
    <div className={`mx-4 my-3 ${style.bg} border rounded-xl p-3`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={`w-5 h-5 ${style.badge} rounded-full flex items-center justify-center text-white text-[10px] font-bold`}>
          {comment.authorType === "ai" ? "AI" : comment.authorName.charAt(0)}
        </div>
        <span className={`text-xs font-medium ${style.nameColor}`}>
          {comment.authorName}
        </span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
    </div>
  );
}
