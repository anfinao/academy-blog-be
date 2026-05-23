import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { CommentsService } from './comments.service';
import { CommentEntity } from 'src/articles/data/entities/comment/comment.entity';
import { CreateCommentInput } from 'src/articles/dto/comment/create-comment.input';

@Resolver(() => CommentEntity)
export class CommentsResolver {
    constructor(private readonly commentsService: CommentsService) { }

    @Query(() => CommentEntity, { name: 'comment', nullable: true })
    async getComment(@Args('id', { type: () => ID }) id: string) {
        return this.commentsService.findOne(id);
    }

    @Query(() => [CommentEntity], { name: 'commentsByArticle' })
    async getCommentsByArticle(@Args('articleId', { type: () => ID }) articleId: string) {
        return this.commentsService.findByArticle(articleId);
    }

    @Mutation(() => CommentEntity)
    async createComment(@Args('createComment') createComment: CreateCommentInput) {
        return this.commentsService.create(createComment);
    }

    @Mutation(() => CommentEntity)
    async updateCommentRating(
        @Args('id', { type: () => ID }) id: string,
        @Args('rating') rating: number,
    ) {
        return this.commentsService.updateRating(id, rating);
    }

    @Mutation(() => CommentEntity)
    async commentRatingUp(@Args('id', { type: () => ID }) id: string) {
        return this.commentsService.upRating(id);
    }

    @Mutation(() => CommentEntity)
    async commentRatingDown(@Args('id', { type: () => ID }) id: string) {
        return this.commentsService.downRating(id);
    }

    @Mutation(() => CommentEntity)
    async voteComment(
        @Args('id', { type: () => ID }) id: string,
        @Args('vote') vote: number,
    ) {
        return this.commentsService.addVote(id, vote);
    }
}