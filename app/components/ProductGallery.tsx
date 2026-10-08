import {useEffect, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import type {ProductVariantFragment} from 'storefrontapi.generated';

type GalleryImage = NonNullable<ProductVariantFragment['image']>;

/** A large image of the product with thumbnails of all its photos below */
export function ProductGallery({
  images,
  selectedImage,
}: {
  images: Omit<GalleryImage, '__typename'>[];
  selectedImage?: ProductVariantFragment['image'];
}) {
  // fall back to the variant's image when the product has no image list
  const allImages = images.length
    ? images
    : selectedImage
      ? [selectedImage]
      : [];
  const variantIndex = allImages.findIndex(
    (image) => image.id === selectedImage?.id,
  );
  const [active, setActive] = useState(Math.max(variantIndex, 0));

  // show the selected variant's photo when the customer picks another option
  useEffect(() => {
    if (variantIndex >= 0) setActive(variantIndex);
  }, [variantIndex]);

  const current = allImages[active] ?? allImages[0];
  if (!current) return <div className="product-gallery" />;

  return (
    <div className="product-gallery">
      <div className="product-image">
        <Image
          alt={current.altText || 'Product Image'}
          aspectRatio="1/1"
          data={current}
          key={current.id}
          sizes="(min-width: 45em) 50vw, 100vw"
        />
      </div>
      {allImages.length > 1 && (
        <div className="product-thumbnails">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className="product-thumbnail"
              aria-label={`Show photo ${index + 1} of ${allImages.length}`}
              aria-current={index === active}
              onClick={() => setActive(index)}
            >
              <Image
                alt=""
                aspectRatio="1/1"
                data={image}
                loading="lazy"
                sizes="6rem"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
