import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import type {HeroSlideFragment} from 'storefrontapi.generated';

export type HeroSlideData = {
  id: string;
  image: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  /** a bundled asset url, used instead of a Shopify image when set */
  localImage?: string;
  /** read by screen readers only; the slide itself shows just the image */
  label: string;
  link: string;
};

const AUTOPLAY_MS = 6000;

/** Turns hero_slide metaobjects from Shopify into slides, ordered by their position field */
export function toHeroSlides(nodes: HeroSlideFragment[]): HeroSlideData[] {
  return nodes
    .map((node, index) => ({
      order: Number(node.position?.value ?? '') || index + 1000,
      slide: {
        id: node.id,
        image:
          node.image?.reference?.__typename === 'MediaImage'
            ? (node.image.reference.image ?? null)
            : null,
        label: node.heading?.value || node.buttonLabel?.value || '',
        link: node.buttonLink?.value ?? '',
      },
    }))
    .sort((a, b) => a.order - b.order)
    .map(({slide}) => slide);
}

export function HeroSlider({slides}: {slides: HeroSlideData[]}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback(
    (index: number) => setActive((index + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => go(active + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, count, paused, go]);

  if (!count) return null;

  return (
    <div
      className="hero-slider"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, index) => (
        <HeroSlide
          key={slide.id}
          slide={slide}
          index={index}
          count={count}
          isActive={index === active}
        />
      ))}
      {count > 1 && (
        <div className="hero-slider-controls">
          <button
            type="button"
            className="hero-slider-arrow"
            aria-label="Previous slide"
            onClick={() => go(active - 1)}
          >
            ‹
          </button>
          <div className="hero-slider-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className="hero-slider-dot"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === active}
                onClick={() => go(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="hero-slider-arrow"
            aria-label="Next slide"
            onClick={() => go(active + 1)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

function HeroSlide({
  slide,
  index,
  count,
  isActive,
}: {
  slide: HeroSlideData;
  index: number;
  count: number;
  isActive: boolean;
}) {
  const isExternal = /^https?:\/\//.test(slide.link);
  const imageAlt = slide.image?.altText || slide.label;

  const image = slide.localImage ? (
    <img alt={imageAlt} src={slide.localImage} />
  ) : slide.image ? (
    <Image
      alt={imageAlt}
      data={slide.image}
      loading={index === 0 ? 'eager' : 'lazy'}
      sizes="100vw"
    />
  ) : null;

  return (
    <div
      className="hero"
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${count}`}
      aria-hidden={!isActive}
      data-active={isActive}
    >
      {!slide.link ? (
        <div className="hero-image">{image}</div>
      ) : isExternal ? (
        <a className="hero-image" href={slide.link} tabIndex={isActive ? 0 : -1}>
          {image}
        </a>
      ) : (
        <Link
          className="hero-image"
          prefetch="intent"
          to={slide.link}
          tabIndex={isActive ? 0 : -1}
        >
          {image}
        </Link>
      )}
    </div>
  );
}
