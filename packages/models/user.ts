import zod from "zod";
import { idEntitySchema, timestampSchema, uidSchema } from "./base";

export const userRoleSchema = zod.enum(["STUDENT", "TEACHER", "ADMIN"]);

export const userParticipationSchema = zod.enum(["NAME", "NICKNAME", "ANONYMOUS"]);

export type UserRole = zod.infer<typeof userRoleSchema>;

export type UserParticipation = zod.infer<typeof userParticipationSchema>;

const quizUsageType = zod.object({
	type: userParticipationSchema, // Which usage type was selected
	name: zod.string().optional(), // Real name or nickname of participating student
});

export const userSchema = zod
	.object({
		role: userRoleSchema, // Role of user
		username: zod.string(), // Username (as provisioned by the ID provider)
		lastLogin: timestampSchema, // Date of last login
		active: zod.boolean(), // Whether the user can login
		quizUsage: zod.map(uidSchema, quizUsageType), // How the user decided to participate in each individual quiz
	})
	.merge(idEntitySchema);

export type User = zod.infer<typeof userSchema>;
