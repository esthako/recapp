import { unionize, ofType, UnionOf } from "unionize";
import { Comment } from "../data/comment";
import { Id } from "../data/base";

export const CommentActorMessages = unionize(
	{
		Create: ofType<Omit<Comment, "uid">>(), // Create a new comment, returns the comment uid
		Update: ofType<Partial<Comment> & { uid: Id }>(), // Update comment data, answers updated Comment
		Upvote: ofType<{ commentId: Id; userId: Id }>(), // Set an upvote on a comment
		Delete: ofType<Id>(),
		GetAll: {}, // Get all quizzes accessible by the requester, will send back all comments in this list to the requester
		SubscribeToCollection: {}, // Subscribe to all changes, sends back all updates to requester. Returns only the requested properties.
		UnsubscribeFromCollection: {}, // Unsubscribe from collection changes
	},
	{ tag: "CommentActorMessage", value: "value" }
);

/** Message send to the client on quiz subscriptions */
export class CommentUpdateMessage {
	public readonly tag = "CommentUpdateMessage" as const;
	constructor(public readonly comment: Partial<Comment>) {}
}

export class CommentDeletedMessage {
	public readonly tag = "CommentDeletedMessage" as const;
	constructor(public readonly id: Id) {}
}

export type CommentActorMessage = UnionOf<typeof CommentActorMessages>;
