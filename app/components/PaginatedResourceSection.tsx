import * as React from 'react';
import {useNavigate} from 'react-router';
import {Pagination} from '@shopify/hydrogen';

/**
 * <PaginatedResourceSection> encapsulates the previous and next pagination behaviors throughout your application.
 * Pass `infiniteScroll` to load the next page automatically when the user scrolls near the end of the list.
 */
export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  ariaLabel,
  resourcesClassName,
  infiniteScroll = false,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{node: NodesType; index: number}>;
  ariaLabel?: string;
  resourcesClassName?: string;
  infiniteScroll?: boolean;
}) {
  return (
    <Pagination connection={connection}>
      {({
        nodes,
        isLoading,
        PreviousLink,
        NextLink,
        hasNextPage,
        nextPageUrl,
        state,
      }) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({node, index}),
        );

        return (
          <div>
            <PreviousLink>
              {isLoading ? (
                'Loading...'
              ) : (
                <span>
                  <span aria-hidden="true">↑</span> Load previous
                </span>
              )}
            </PreviousLink>
            {resourcesClassName ? (
              <div
                aria-label={ariaLabel}
                className={resourcesClassName}
                role={ariaLabel ? 'region' : undefined}
              >
                {resourcesMarkup}
              </div>
            ) : (
              resourcesMarkup
            )}
            {infiniteScroll ? (
              <LoadMoreOnScroll
                hasNextPage={hasNextPage}
                nextPageUrl={nextPageUrl}
                isLoading={isLoading}
                state={state}
              />
            ) : (
              <NextLink>
                {isLoading ? (
                  'Loading...'
                ) : (
                  <span>
                    Load more <span aria-hidden="true">↓</span>
                  </span>
                )}
              </NextLink>
            )}
          </div>
        );
      }}
    </Pagination>
  );
}

/**
 * Renders an invisible sentinel after the list and navigates to the next page
 * when it comes into view, reusing Hydrogen's pagination state so nodes accumulate.
 */
function LoadMoreOnScroll({
  hasNextPage,
  nextPageUrl,
  isLoading,
  state,
}: {
  hasNextPage: boolean;
  nextPageUrl: string;
  isLoading: boolean;
  state: unknown;
}) {
  const navigate = useNavigate();
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      {rootMargin: '400px 0px'},
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const stateRef = React.useRef(state);
  stateRef.current = state;
  const requestedUrlRef = React.useRef<string | null>(null);

  // Re-runs when nextPageUrl changes, so it keeps loading while the sentinel stays visible.
  React.useEffect(() => {
    if (!inView || !hasNextPage || isLoading) return;
    if (requestedUrlRef.current === nextPageUrl) return;

    requestedUrlRef.current = nextPageUrl;
    void navigate(nextPageUrl, {
      replace: true,
      preventScrollReset: true,
      state: stateRef.current,
    });
  }, [inView, hasNextPage, isLoading, nextPageUrl, navigate]);

  if (!hasNextPage) return null;

  return (
    <div ref={sentinelRef} className="pagination-sentinel" aria-live="polite">
      {isLoading ? 'Loading...' : null}
    </div>
  );
}
