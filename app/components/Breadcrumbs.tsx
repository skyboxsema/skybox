import {Link} from 'react-router';

export type Crumb = {label: string; to?: string};

/** Trail of links back up the site; the last crumb is the current page */
export function Breadcrumbs({crumbs}: {crumbs: Crumb[]}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((crumb, index) => {
          const isCurrent = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`}>
              {isCurrent || !crumb.to ? (
                <span aria-current={isCurrent ? 'page' : undefined}>
                  {crumb.label}
                </span>
              ) : (
                <Link prefetch="intent" to={crumb.to}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
