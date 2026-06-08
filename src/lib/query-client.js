import { QueryClient, MutationCache } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

// Surface mutation failures to the user instead of failing silently. A mutation
// can still opt out by handling onError itself and setting meta.silent, or by
// providing its own toast (this fires in addition, so prefer meta.silent there).
export const queryClientInstance = new QueryClient({
	mutationCache: new MutationCache({
		onError: (error, _vars, _ctx, mutation) => {
			if (mutation?.meta?.silent) return;
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
