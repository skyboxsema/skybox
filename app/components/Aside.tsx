import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {useId} from 'react';
import {useLocation} from 'react-router';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideOptions = {
  /**
   * Opens without an overlay, so the page stays usable beside the aside and
   * clicking it doesn't close the aside: only × or Escape does, or leaving
   * the page
   */
  docked?: boolean;
};
type AsideContextValue = {
  type: AsideType;
  docked: boolean;
  open: (mode: AsideType, options?: AsideOptions) => void;
  close: () => void;
};

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const {type: activeType, docked: activeDocked, close} = useAside();
  const expanded = type === activeType;
  const docked = expanded && activeDocked;
  const id = useId();
  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          // Escape over an open modal (the quick view) closes that instead
          if (
            event.key === 'Escape' &&
            !document.querySelector('dialog[open]')
          ) {
            close();
          }
        },
        {signal: abortController.signal},
      );
    }
    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <div
      aria-modal={!docked}
      className={`overlay ${expanded ? 'expanded' : ''} ${docked ? 'docked' : ''}`}
      role="dialog"
      aria-labelledby={id}
    >
      {!docked && <button className="close-outside" onClick={close} />}
      <aside>
        <header>
          <h3 id={id}>{heading}</h3>
          <button className="close reset" onClick={close} aria-label="Close">
            &times;
          </button>
        </header>
        <main>{children}</main>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [{type, docked}, setState] = useState({
    type: 'closed' as AsideType,
    docked: false,
  });
  const {pathname} = useLocation();

  // a docked aside belongs to the page it was opened on
  useEffect(() => {
    setState((state) =>
      state.docked ? {type: 'closed', docked: false} : state,
    );
  }, [pathname]);

  return (
    <AsideContext.Provider
      value={{
        type,
        docked,
        open: (mode, options) =>
          setState({type: mode, docked: Boolean(options?.docked)}),
        close: () => setState({type: 'closed', docked: false}),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
