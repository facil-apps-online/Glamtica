import React, { useState, useEffect, useCallback } from 'react'
import { TreatmentImage } from '@/hooks/useTreatments'
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage'
import useEmblaCarousel, { EmblaOptionsType } from 'embla-carousel-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PropType = {
  images?: TreatmentImage[]
  treatmentName: string
  options?: EmblaOptionsType
}

const ImageSlide = ({ imageUrl, treatmentName }) => {
  const { displayUrl, isLoading } = useGoogleDriveImage(imageUrl)

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-t-lg">
      {isLoading && <Skeleton className="h-full w-full" />}
      {displayUrl && !isLoading && (
        <img
          src={displayUrl}
          alt={`Imagen de ${treatmentName}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      )}
    </div>
  )
}

export const TreatmentImageCarousel: React.FC<PropType> = ({ images, treatmentName, options }) => {
  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
        <img
          src="/placeholder.svg"
          alt="Imagen de tratamiento no disponible"
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  // Find the primary image, or default to the first one
  const primaryImage = images.find(img => img.is_primary) || images[0];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="embla group relative cursor-pointer">
          {/* Use primaryImage.image_url instead of images[0].image_url */}
          <ImageSlide imageUrl={primaryImage.image_url} treatmentName={treatmentName} />
        </div>
      </DialogTrigger>
          <DialogContent className="max-w-3xl p-0">
            <DialogTitle className="sr-only">Imágenes de {treatmentName}</DialogTitle>
            <CarouselContent images={images} treatmentName={treatmentName} options={options} />
          </DialogContent>
    </Dialog>
  )
}

const CarouselContent = ({ images, treatmentName, options }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {images?.map((image) => (
            <div className="embla__slide relative aspect-video flex-[0_0_100%]" key={image.id}>
              <ImageSlide imageUrl={image.image_url} treatmentName={treatmentName} />
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/75 hover:text-white"
        onClick={scrollPrev}
        disabled={prevBtnDisabled}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/75 hover:text-white"
        onClick={scrollNext}
        disabled={nextBtnDisabled}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  )
}
