
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  url?: string | null;
}

interface Props {
  announcement: Announcement;
}

const AnnouncementBanner: React.FC<Props> = ({ announcement }) => {
  return (
    <Card className="bg-gradient-accent border-0 shadow-card mb-6">
      <CardContent className="py-4 px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary">公告</Badge>
            <h3 className="text-base md:text-lg font-semibold text-accent-foreground">
              {announcement.title}
            </h3>
          </div>
          <p className="text-sm text-accent-foreground/80">
            {announcement.content}
          </p>
        </div>
        {announcement.url ? (
          <a
            href={announcement.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent-foreground underline underline-offset-4"
          >
            查看详情
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default AnnouncementBanner;
