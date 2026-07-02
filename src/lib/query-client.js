import { QueryClient, MutationCache } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

// Fallback surfacing of mutation failures so they never fail silently. This is
// ONLY for mutations that don't handle errors themselves — if a mutation defines
// its own onError (its own friendly toast) or opts out via meta.silent, the
// generic toast is skipped so the user doesn't see two messages.
export const queryClientInstance = new QueryClient({
	mutationCache: new MutationCache({
		onError: (error, _vars, _ctx, mutation) => {
			if (mutation?.meta?.silent || mutation?.options?.onError) return;
			toast({
				title: 'Something went wrong',
				description: error?.message || 'The action could not be completed. Please try again.',
				variant: 'destructive',
			});
		},
	}),
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});
