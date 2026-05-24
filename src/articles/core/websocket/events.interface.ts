export interface CommentCreatedEvent {
  type: 'COMMENT_CREATED';
  payload: {
    commentId: string;
    articleId: string;
    content: string;
    author?: string;
    createdAt: Date;
  };
}

export interface ArticleRatingChangedEvent {
  type: 'ARTICLE_RATING_CHANGED';
  payload: {
    articleId: string;
    rating: number;
    prevRating?: number;
  };
}

export interface CommentRatingChangedEvent {
  type: 'COMMENT_RATING_CHANGED';
  payload: {
    commentId: string;
    articleId: string;
    rating: number;
    prevRating?: number;
  };
}

export type WebSocketEvent =
  | CommentCreatedEvent
  | ArticleRatingChangedEvent
  | CommentRatingChangedEvent;
