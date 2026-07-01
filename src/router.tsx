import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { PageSkeleton } from "./components/Skeletons";
import { DefaultErrorComponent } from "./components/DefaultErrorComponent";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PageSkeleton,
    defaultPendingMs: 150,
    defaultPendingMinMs: 200,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
