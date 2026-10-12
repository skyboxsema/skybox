import {useEffect, useRef} from 'react';

/**
 * "How it works" popup for Build Your Box. Opens `delay` ms after the page
 * mounts (each time the visitor arrives on it) and closes on the ✕ button,
 * the main button, Escape, or a click on the backdrop.
 */
export function BuildBoxIntro({delay = 2000}: {delay?: number}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!dialog.current?.open) dialog.current?.showModal();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  const close = () => dialog.current?.close();

  return (
    <dialog
      aria-labelledby="build-box-intro-title"
      className="build-box-intro"
      onClick={(event) => {
        // clicks on the backdrop land on the <dialog> element itself
        if (event.target === event.currentTarget) close();
      }}
      ref={dialog}
    >
      <div className="build-box-intro-inner">
        <button
          aria-label="Close"
          className="build-box-intro-close reset"
          onClick={close}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <p className="eyebrow">Build your box</p>
        <h2 id="build-box-intro-title">Design Your Own Gift Box</h2>
        <p className="build-box-intro-lead">
          Creating a thoughtful gift has never been easier. In just three
          steps, build a box around the things they love, and we&rsquo;ll
          ship it fast.
        </p>

        <ol className="build-box-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <div className="build-box-step-art">{step.art}</div>
              <h3>
                <span>{index + 1}.</span> {step.title}
              </h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>

        <button className="button" onClick={close} type="button">
          Start building
        </button>
      </div>
    </dialog>
  );
}

const STEPS = [
  {
    title: 'Choose Your Box',
    text: 'Pick a box design that suits the occasion and sets the tone for an elegant unboxing.',
    art: <BoxesArt />,
  },
  {
    title: 'Select Your Gifts',
    text: 'Browse our curated categories and fill your box with the pieces that fit your gift best.',
    art: <GiftsArt />,
  },
  {
    title: 'Personalize It',
    text: 'Finish with a handwritten note card, a greeting card and other personal touches.',
    art: <PersonalizeArt />,
  },
];

// Illustrations, drawn in the store palette

function BoxesArt() {
  const boxes = [
    {x: 22, y: 18, fill: '#15120e', accent: '#e2c992'},
    {x: 112, y: 18, fill: '#b8975a', accent: '#fcfaf5'},
    {x: 22, y: 92, fill: '#f3ecdf', accent: '#86672f'},
    {x: 112, y: 92, fill: '#86672f', accent: '#f3ecdf'},
  ];
  return (
    <svg aria-hidden="true" viewBox="0 0 200 180">
      <circle cx="100" cy="90" fill="#f3ecdf" r="86" />
      {boxes.map((box) => (
        <g key={`${box.x}-${box.y}`}>
          <rect
            fill={box.fill}
            height="60"
            rx="3"
            stroke="rgba(21,18,14,0.2)"
            width="70"
            x={box.x}
            y={box.y}
          />
          <path
            d={`M${box.x + 18} ${box.y + 30}h34`}
            stroke={box.accent}
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d={`M${box.x + 26} ${box.y + 38}h18`}
            stroke={box.accent}
            strokeLinecap="round"
            strokeWidth="1.2"
          />
        </g>
      ))}
    </svg>
  );
}

function GiftsArt() {
  const items = [
    {cx: 52, cy: 42, label: 'Candle', badge: '+'},
    {cx: 100, cy: 30, label: 'Journal', badge: '+'},
    {cx: 148, cy: 42, label: 'Plant', badge: '1'},
    {cx: 52, cy: 104, label: 'Cocoa', badge: '1'},
    {cx: 100, cy: 92, label: 'Mug', badge: '1'},
    {cx: 148, cy: 104, label: 'Soap', badge: '+'},
    {cx: 76, cy: 152, label: 'Tea', badge: '2'},
    {cx: 124, cy: 152, label: 'Coffee', badge: '+'},
  ];
  return (
    <svg aria-hidden="true" viewBox="0 0 200 180">
      <rect fill="#f3ecdf" height="176" rx="70" width="170" x="15" y="2" />
      {items.map((item) => (
        <g key={item.label}>
          <circle
            cx={item.cx}
            cy={item.cy}
            fill="#fcfaf5"
            r="17"
            stroke="#b8975a"
          />
          <text
            fill="#15120e"
            fontFamily="var(--font-body)"
            fontSize="7.5"
            textAnchor="middle"
            x={item.cx}
            y={item.cy + 3}
          >
            {item.label}
          </text>
          <circle
            cx={item.cx + 13}
            cy={item.cy - 13}
            fill={item.badge === '+' ? '#fcfaf5' : '#15120e'}
            r="6"
            stroke="#15120e"
            strokeWidth="0.8"
          />
          <text
            fill={item.badge === '+' ? '#15120e' : '#e2c992'}
            fontFamily="var(--font-body)"
            fontSize="8"
            textAnchor="middle"
            x={item.cx + 13}
            y={item.cy - 10.2}
          >
            {item.badge}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PersonalizeArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 180">
      <rect fill="#f3ecdf" height="176" rx="80" width="160" x="20" y="2" />
      {/* box */}
      <rect fill="#15120e" height="74" rx="3" width="124" x="38" y="22" />
      <path d="M100 22v74M38 59h124" stroke="#b8975a" strokeWidth="5" />
      <path
        d="M100 59c-14-18-30-14-24-4 4 7 24 4 24 4zm0 0c14-18 30-14 24-4-4 7-24 4-24 4z"
        fill="#e2c992"
        stroke="#86672f"
      />
      {/* note card */}
      <rect
        fill="#fcfaf5"
        height="62"
        rx="2"
        stroke="#b8975a"
        transform="rotate(-6 100 140)"
        width="104"
        x="48"
        y="106"
      />
      <g stroke="#86672f" strokeLinecap="round" transform="rotate(-6 100 140)">
        <path d="M64 124h46" strokeWidth="1.6" />
        <path d="M64 136h72M64 146h60M64 156h40" strokeWidth="1" />
      </g>
    </svg>
  );
}
