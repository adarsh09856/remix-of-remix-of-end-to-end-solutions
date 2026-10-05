import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function RoutePending() {
  return (
    <main className="flex-1">
      <div className="container-page py-16">
        <div className="h-4 w-32 rounded-full bg-muted" />
        <div className="mt-6 h-14 max-w-xl rounded-2xl bg-muted" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-56 rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </div>
    </main>
  );
}

function DefaultRouteError() {
  return (
    <main className="flex-1">
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-4xl">This page could not load</h1>
        <a href="/" className="btn-hero mt-6">Go home</a>
      </div>
    </main>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingMs: 800,
    defaultPendingMinMs: 0,
    defaultPendingComponent: RoutePending,
    defaultErrorComponent: DefaultRouteError,
  });

  return router;
};
