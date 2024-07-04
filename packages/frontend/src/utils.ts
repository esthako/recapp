import { curry } from "rambda";
import { ActorSystem, ActorRef } from "ts-actors";
import { Try, Maybe, nothing, maybe } from "tsmonads";
import { Question } from "@recapp/models";

export const cookie = (name: string): string => {
	const cookies = new Map(
		document.cookie.split(";").map(c => {
			const [k, v] = c.split("=", 2);
			if (!k) {
				return ["", ""];
			} else {
				return [k.trim(), v.trim()];
			}
		})
	);
	return cookies.get(name) ?? "";
};

export const flattenSystem = <T>(
	tSystem: Try<ActorSystem>,
	tActor: Try<ActorRef>,
	mbState: Maybe<T>
): Maybe<[ActorSystem, ActorRef, T]> => {
	const state = mbState.orUndefined();
	if (!state) return nothing();
	const actor = tActor.toMaybe().orUndefined();
	if (!actor) return nothing();
	return tSystem.toMaybe().flatMap(s => maybe([s, actor, state] as [ActorSystem, ActorRef, T]));
};

export const shuffle = curry(<T>(random: () => number, list: T[]) => {
	let idx = -1;
	const len = list.length;
	let position;
	const result: Array<T> = [];
	while (++idx < len) {
		position = Math.floor((idx + 1) * random());
		result[idx] = result[position];
		result[position] = list[idx];
	}
	return result;
});

export const isMultiChoiceAnsweredCorrectly = (answers2: boolean[], question: Question | undefined) => {
	const answers = [...answers2];
	if (answers.length === 0) {
		return false;
	}

	while (answers.length < (question?.answers.length ?? 0)) {
		answers.push(false);
	}

	const isAnsweredCorrectly = answers.map((a, i) => !!a === question?.answers[i].correct).every(Boolean);
	return isAnsweredCorrectly;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce(callBack: (...args: any) => void, delay: number) {
	let timeoutId: null | ReturnType<typeof setTimeout> = null;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (...args: any) {
		if (timeoutId) clearTimeout(timeoutId);

		timeoutId = setTimeout(() => callBack(...args), delay);
	};
}
