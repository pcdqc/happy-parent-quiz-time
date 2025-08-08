
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ReferenceBook {
  id: string;
  title: string;
  author?: string | null;
  edition?: string | null;
  isbn?: string | null;
  cover_url?: string | null;
  tags?: string[] | null;
  description?: string | null;
}

interface Props {
  book: ReferenceBook;
}

const ReferenceBookCard: React.FC<Props> = ({ book }) => {
  return (
    <Card className="bg-gradient-card border-0 shadow-card h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-1">{book.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        {book.cover_url ? (
          <div className="w-full h-36 rounded-md overflow-hidden bg-muted mb-3">
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-36 rounded-md bg-muted mb-3 flex items-center justify-center text-muted-foreground text-sm">
            无封面
          </div>
        )}
        <div className="text-sm text-muted-foreground mb-2">
          {book.author ? `作者：${book.author}` : "作者：未知"}
        </div>
        {book.tags && book.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-auto">
            {book.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default ReferenceBookCard;
