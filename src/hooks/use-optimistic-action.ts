import {
	useCallback,
	useOptimistic,
	useTransition,
	type TransitionStartFunction,
} from "react";

/**
 * Wraps an async mutation with useOptimistic + startTransition.
 * Reverts automatically when the action throws or the source value unchanged.
 */
export function useOptimisticAction<T>(
	value: T,
	action: (next: T) => void | Promise<void>,
) {
	const [optimisticValue, setOptimisticValue] = useOptimistic(value);
	const [isPending, startTransition] = useTransition();

	const commit = useCallback(
		(next: T) => {
			(startTransition as TransitionStartFunction)(async () => {
				setOptimisticValue(next);
				await action(next);
			});
		},
		[action, setOptimisticValue],
	);

	return { value: optimisticValue, commit, isPending };
}
