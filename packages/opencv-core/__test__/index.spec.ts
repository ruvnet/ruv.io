import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  OpenCVCore,
  createImage,
  getImageProperties,
  convertColorSpace,
  getColorSpaceInfo,
  resizeImage,
  getImageDimensions,
  batchProcessImages,
  getSupportedColorSpaces,
  getImageStatistics,
  ImageInfo,
  ColorSpaceInfo,
  ImageProperties,
  ImageDimensions,
} from '../src/index'

describe('OpenCV Core - Image Processing', () => {
  const sampleImage: ImageInfo = {
    id: 'img-001',
    width: 640,
    height: 480,
    channels: 3,
    data_type: 'uint8',
    metadata: {
      source: 'test',
      version: '1.0',
    },
  }

  const sampleImage2: ImageInfo = {
    id: 'img-002',
    width: 1920,
    height: 1080,
    channels: 4,
    data_type: 'uint8',
    metadata: {
      source: 'test',
      version: '1.0',
    },
  }

  describe('createImage', () => {
    it('should create an image from metadata', () => {
      const result = createImage(sampleImage)

      expect(result).toBeDefined()
      expect(result.id).toBe('img-001')
      expect(result.width).toBe(640)
      expect(result.height).toBe(480)
      expect(result.channels).toBe(3)
    })

    it('should preserve image metadata', () => {
      const result = createImage(sampleImage)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.source).toBe('test')
      expect(result.metadata.version).toBe('1.0')
    })

    it('should add creation metadata', () => {
      const result = createImage(sampleImage)

      expect(result.metadata.created_at).toBeDefined()
      expect(result.metadata.expected_size).toBe(640 * 480 * 3)
      expect(result.metadata.status).toBe('created')
    })

    it('should handle different image sizes', () => {
      const image: ImageInfo = {
        id: 'img-small',
        width: 100,
        height: 100,
        channels: 1,
        data_type: 'uint8',
      }

      const result = createImage(image)

      expect(result.width).toBe(100)
      expect(result.height).toBe(100)
      expect(result.channels).toBe(1)
    })

    it('should handle different channel counts', () => {
      const imageRGBA: ImageInfo = {
        id: 'img-rgba',
        width: 640,
        height: 480,
        channels: 4,
        data_type: 'uint8',
      }

      const result = createImage(imageRGBA)

      expect(result.channels).toBe(4)
    })

    it('should reject invalid dimensions', () => {
      const invalidImage: ImageInfo = {
        id: 'invalid',
        width: 0,
        height: 480,
        channels: 3,
        data_type: 'uint8',
      }

      expect(() => {
        createImage(invalidImage)
      }).toThrow()
    })
  })

  describe('getImageProperties', () => {
    it('should get image properties', () => {
      const result: ImageProperties = getImageProperties(sampleImage)

      expect(result).toBeDefined()
      expect(result.id).toBe('img-001')
      expect(result.width).toBe(640)
      expect(result.height).toBe(480)
      expect(result.channels).toBe(3)
    })

    it('should calculate total pixels correctly', () => {
      const result: ImageProperties = getImageProperties(sampleImage)

      expect(result.total_pixels).toBe(640 * 480)
    })

    it('should calculate total elements correctly', () => {
      const result: ImageProperties = getImageProperties(sampleImage)

      expect(result.total_elements).toBe(640 * 480 * 3)
    })

    it('should calculate aspect ratio correctly', () => {
      const result: ImageProperties = getImageProperties(sampleImage)

      expect(result.aspect_ratio).toBeCloseTo(640 / 480, 2)
    })

    it('should estimate memory bytes', () => {
      const result: ImageProperties = getImageProperties(sampleImage)

      expect(result.estimated_bytes).toBe(640 * 480 * 3)
    })

    it('should handle square images', () => {
      const squareImage: ImageInfo = {
        id: 'img-square',
        width: 512,
        height: 512,
        channels: 3,
        data_type: 'uint8',
      }

      const result: ImageProperties = getImageProperties(squareImage)

      expect(result.aspect_ratio).toBe(1.0)
    })
  })

  describe('convertColorSpace', () => {
    it('should convert from BGR to RGB', () => {
      const result = convertColorSpace(sampleImage, 'BGR', 'RGB')

      expect(result).toBeDefined()
      expect(result.id).toBe('img-001')
      expect(result.channels).toBe(3)
    })

    it('should convert from RGB to GRAY', () => {
      const result = convertColorSpace(sampleImage, 'RGB', 'GRAY')

      expect(result).toBeDefined()
      expect(result.channels).toBe(1) // Grayscale has 1 channel
    })

    it('should convert to HSV', () => {
      const result = convertColorSpace(sampleImage, 'BGR', 'HSV')

      expect(result).toBeDefined()
      expect(result.channels).toBe(3)
    })

    it('should convert to YUV', () => {
      const result = convertColorSpace(sampleImage, 'RGB', 'YUV')

      expect(result).toBeDefined()
      expect(result.channels).toBe(3)
    })

    it('should add conversion metadata', () => {
      const result = convertColorSpace(sampleImage, 'BGR', 'RGB')

      expect(result.metadata).toBeDefined()
      expect(result.metadata.conversion).toBe('BGR -> RGB')
      expect(result.metadata.status).toBe('converted')
    })

    it('should handle RGBA conversion', () => {
      const result = convertColorSpace(sampleImage2, 'BGRA', 'RGB')

      expect(result).toBeDefined()
    })
  })

  describe('getColorSpaceInfo', () => {
    it('should get BGR color space info', () => {
      const info: ColorSpaceInfo = getColorSpaceInfo('BGR')

      expect(info.name).toBe('BGR')
      expect(info.channels).toBe(3)
      expect(info.description).toBeDefined()
    })

    it('should get RGB color space info', () => {
      const info: ColorSpaceInfo = getColorSpaceInfo('RGB')

      expect(info.name).toBe('RGB')
      expect(info.channels).toBe(3)
    })

    it('should get GRAY color space info', () => {
      const info: ColorSpaceInfo = getColorSpaceInfo('GRAY')

      expect(info.name).toBe('GRAY')
      expect(info.channels).toBe(1)
    })

    it('should get HSV color space info', () => {
      const info: ColorSpaceInfo = getColorSpaceInfo('HSV')

      expect(info.name).toBe('HSV')
      expect(info.channels).toBe(3)
    })

    it('should get RGBA color space info', () => {
      const info: ColorSpaceInfo = getColorSpaceInfo('RGBA')

      expect(info.channels).toBe(4)
    })

    it('should return consistent channel counts', () => {
      const bgrInfo = getColorSpaceInfo('BGR')
      const rgbInfo = getColorSpaceInfo('RGB')

      expect(bgrInfo.channels).toBe(rgbInfo.channels)
    })
  })

  describe('resizeImage', () => {
    it('should resize image to larger dimensions', () => {
      const result = resizeImage(sampleImage, 1280, 960)

      expect(result.width).toBe(1280)
      expect(result.height).toBe(960)
      expect(result.channels).toBe(3)
    })

    it('should resize image to smaller dimensions', () => {
      const result = resizeImage(sampleImage, 320, 240)

      expect(result.width).toBe(320)
      expect(result.height).toBe(240)
    })

    it('should calculate correct scaling factors', () => {
      const result = resizeImage(sampleImage, 1280, 960)

      expect(result.metadata.scale_x).toBeCloseTo(2.0, 2)
      expect(result.metadata.scale_y).toBeCloseTo(2.0, 2)
    })

    it('should preserve aspect ratio if needed', () => {
      // Resize to maintain aspect ratio (manual calculation)
      const image = sampleImage
      const result = resizeImage(image, 320, 240)

      expect(result.metadata.scale_x).toBeCloseTo(0.5, 2)
      expect(result.metadata.scale_y).toBeCloseTo(0.5, 2)
    })

    it('should handle non-proportional resizing', () => {
      const result = resizeImage(sampleImage, 800, 400)

      expect(result.width).toBe(800)
      expect(result.height).toBe(400)
      expect(result.metadata.scale_x).not.toEqual(result.metadata.scale_y)
    })

    it('should mark image as resized', () => {
      const result = resizeImage(sampleImage, 1280, 960)

      expect(result.metadata.resized).toBe(true)
      expect(result.metadata.status).toBe('resized')
    })
  })

  describe('getImageDimensions', () => {
    it('should get image dimensions', () => {
      const result: ImageDimensions = getImageDimensions(sampleImage)

      expect(result.width).toBe(640)
      expect(result.height).toBe(480)
      expect(result.channels).toBe(3)
    })

    it('should calculate aspect ratio', () => {
      const result: ImageDimensions = getImageDimensions(sampleImage)

      expect(result.aspect_ratio).toBeCloseTo(4 / 3, 2)
    })

    it('should calculate total pixels', () => {
      const result: ImageDimensions = getImageDimensions(sampleImage)

      expect(result.total_pixels).toBe(640 * 480)
    })

    it('should include DPI information', () => {
      const result: ImageDimensions = getImageDimensions(sampleImage)

      expect(result.dpi).toBe(72)
    })

    it('should work with HD resolution', () => {
      const result: ImageDimensions = getImageDimensions(sampleImage2)

      expect(result.width).toBe(1920)
      expect(result.height).toBe(1080)
    })
  })

  describe('batchProcessImages', () => {
    it('should process multiple images', () => {
      const images = [sampleImage, sampleImage2]
      const results = batchProcessImages(images)

      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('img-001')
      expect(results[1].id).toBe('img-002')
    })

    it('should process each image independently', () => {
      const images = [sampleImage, sampleImage2]
      const results = batchProcessImages(images)

      expect(results[0].width).toBe(640)
      expect(results[1].width).toBe(1920)
    })

    it('should preserve image metadata in batch processing', () => {
      const images = [sampleImage, sampleImage2]
      const results = batchProcessImages(images)

      expect(results[0].id).toBe('img-001')
      expect(results[1].id).toBe('img-002')
    })

    it('should handle empty array', () => {
      const results = batchProcessImages([])

      expect(results).toHaveLength(0)
    })

    it('should handle large batch of images', () => {
      const images = Array.from({ length: 50 }, (_, i) => ({
        id: `img-${i}`,
        width: 640 + i,
        height: 480 + i,
        channels: 3,
        data_type: 'uint8',
      }))

      const results = batchProcessImages(images)

      expect(results).toHaveLength(50)
      expect(results[0].id).toBe('img-0')
      expect(results[49].id).toBe('img-49')
    })

    it('should handle images with different properties', () => {
      const images = [
        sampleImage,
        { id: 'gray-img', width: 640, height: 480, channels: 1, data_type: 'uint8' },
        sampleImage2,
      ]

      const results = batchProcessImages(images)

      expect(results).toHaveLength(3)
      expect(results[1].channels).toBe(1)
    })
  })

  describe('getSupportedColorSpaces', () => {
    it('should return list of supported color spaces', () => {
      const colorSpaces: ColorSpaceInfo[] = getSupportedColorSpaces()

      expect(Array.isArray(colorSpaces)).toBe(true)
      expect(colorSpaces.length).toBeGreaterThan(0)
    })

    it('should include BGR color space', () => {
      const colorSpaces = getSupportedColorSpaces()

      const bgr = colorSpaces.find((cs) => cs.name === 'BGR')
      expect(bgr).toBeDefined()
      expect(bgr?.channels).toBe(3)
    })

    it('should include RGB color space', () => {
      const colorSpaces = getSupportedColorSpaces()

      const rgb = colorSpaces.find((cs) => cs.name === 'RGB')
      expect(rgb).toBeDefined()
      expect(rgb?.channels).toBe(3)
    })

    it('should include GRAY color space', () => {
      const colorSpaces = getSupportedColorSpaces()

      const gray = colorSpaces.find((cs) => cs.name === 'GRAY')
      expect(gray).toBeDefined()
      expect(gray?.channels).toBe(1)
    })

    it('should include HSV color space', () => {
      const colorSpaces = getSupportedColorSpaces()

      const hsv = colorSpaces.find((cs) => cs.name === 'HSV')
      expect(hsv).toBeDefined()
      expect(hsv?.channels).toBe(3)
    })

    it('should have descriptions for all color spaces', () => {
      const colorSpaces = getSupportedColorSpaces()

      colorSpaces.forEach((cs) => {
        expect(cs.description).toBeDefined()
        expect(cs.description.length).toBeGreaterThan(0)
      })
    })

    it('should have valid channel counts', () => {
      const colorSpaces = getSupportedColorSpaces()

      colorSpaces.forEach((cs) => {
        expect(cs.channels).toBeGreaterThan(0)
        expect(cs.channels).toBeLessThanOrEqual(4)
      })
    })
  })

  describe('getImageStatistics', () => {
    it('should get image statistics', () => {
      const stats = getImageStatistics(sampleImage)

      expect(stats).toBeDefined()
      expect(stats.id).toBe('img-001')
      expect(stats.width).toBe(640)
      expect(stats.height).toBe(480)
    })

    it('should include total pixels', () => {
      const stats = getImageStatistics(sampleImage)

      expect(stats.total_pixels).toBe(640 * 480)
    })

    it('should estimate memory usage', () => {
      const stats = getImageStatistics(sampleImage)

      expect(stats.estimated_memory_bytes).toBe(640 * 480 * 3)
    })

    it('should include data type', () => {
      const stats = getImageStatistics(sampleImage)

      expect(stats.data_type).toBe('uint8')
    })

    it('should include timestamp', () => {
      const stats = getImageStatistics(sampleImage)

      expect(stats.timestamp).toBeDefined()
    })

    it('should handle different image types', () => {
      const grayImage: ImageInfo = {
        id: 'gray-stat',
        width: 1024,
        height: 768,
        channels: 1,
        data_type: 'uint8',
      }

      const stats = getImageStatistics(grayImage)

      expect(stats.total_pixels).toBe(1024 * 768)
      expect(stats.estimated_memory_bytes).toBe(1024 * 768 * 1)
    })
  })

  describe('OpenCVCore class', () => {
    let opencvCore: OpenCVCore

    beforeAll(() => {
      opencvCore = new OpenCVCore()
    })

    it('should create instance', () => {
      expect(opencvCore).toBeDefined()
      expect(opencvCore).toBeInstanceOf(OpenCVCore)
    })

    it('should create image via instance method', () => {
      const result = opencvCore.createImage(sampleImage)

      expect(result).toBeDefined()
      expect(result.id).toBe('img-001')
    })

    it('should get properties via instance method', () => {
      const result = opencvCore.getProperties(sampleImage)

      expect(result).toBeDefined()
      expect(result.total_pixels).toBe(640 * 480)
    })

    it('should convert color space via instance method', () => {
      const result = opencvCore.convertColor(sampleImage, 'BGR', 'RGB')

      expect(result).toBeDefined()
      expect(result.channels).toBe(3)
    })

    it('should get color space info via instance method', () => {
      const info = opencvCore.getColorSpaceInfo('BGR')

      expect(info).toBeDefined()
      expect(info.name).toBe('BGR')
    })

    it('should resize image via instance method', () => {
      const result = opencvCore.resize(sampleImage, 1280, 960)

      expect(result.width).toBe(1280)
      expect(result.height).toBe(960)
    })

    it('should get dimensions via instance method', () => {
      const result = opencvCore.getDimensions(sampleImage)

      expect(result.width).toBe(640)
      expect(result.height).toBe(480)
    })

    it('should batch process images via instance method', () => {
      const images = [sampleImage, sampleImage2]
      const results = opencvCore.batchProcess(images)

      expect(results).toHaveLength(2)
    })

    it('should get supported color spaces via instance method', () => {
      const colorSpaces = opencvCore.getSupportedColorSpaces()

      expect(Array.isArray(colorSpaces)).toBe(true)
      expect(colorSpaces.length).toBeGreaterThan(0)
    })

    it('should get statistics via instance method', () => {
      const stats = opencvCore.getStatistics(sampleImage)

      expect(stats).toBeDefined()
      expect(stats.total_pixels).toBe(640 * 480)
    })
  })

  describe('Integration tests', () => {
    it('should create, get properties, and resize image in sequence', () => {
      // Create image
      const created = createImage(sampleImage)
      expect(created).toBeDefined()

      // Get properties
      const props = getImageProperties(created)
      expect(props.total_pixels).toBe(640 * 480)

      // Resize
      const resized = resizeImage(created, 1280, 960)
      expect(resized.width).toBe(1280)
    })

    it('should handle complete image processing workflow', () => {
      // Create
      const image = createImage(sampleImage)

      // Convert color space
      const converted = convertColorSpace(image, 'BGR', 'HSV')

      // Get statistics
      const stats = getImageStatistics(converted)

      // Verify pipeline
      expect(converted.id).toBe('img-001')
      expect(stats.total_pixels).toBe(640 * 480)
    })

    it('should maintain data integrity through processing', () => {
      const image = sampleImage
      const props = getImageProperties(image)

      expect(props.id).toBe(image.id)
      expect(props.width).toBe(image.width)
      expect(props.height).toBe(image.height)
      expect(props.channels).toBe(image.channels)
    })

    it('should handle multiple transformations', () => {
      let image = sampleImage

      // Resize
      image = resizeImage(image, 1920, 1440)
      expect(image.width).toBe(1920)

      // Convert color
      image = convertColorSpace(image, 'BGR', 'GRAY')
      expect(image.channels).toBe(1)

      // Resize again
      image = resizeImage(image, 960, 720)
      expect(image.width).toBe(960)

      // Get final stats
      const stats = getImageStatistics(image)
      expect(stats.total_pixels).toBe(960 * 720)
    })

    it('should batch process and analyze results', () => {
      const images = [sampleImage, sampleImage2]
      const results = batchProcessImages(images)

      expect(results).toHaveLength(2)

      const totalPixels = results.reduce((sum, img) => sum + img.width * img.height, 0)
      expect(totalPixels).toBeGreaterThan(0)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid image data', () => {
      expect(() => {
        const invalidImage = { id: 'invalid' } as any
        getImageProperties(invalidImage)
      }).toThrow()
    })

    it('should handle large image dimensions', () => {
      const largeImage: ImageInfo = {
        id: 'large-img',
        width: 8192,
        height: 8192,
        channels: 3,
        data_type: 'uint8',
      }

      const props = getImageProperties(largeImage)

      expect(props).toBeDefined()
      expect(props.total_pixels).toBe(8192 * 8192)
    })

    it('should handle extreme aspect ratios', () => {
      const ultrawide: ImageInfo = {
        id: 'ultrawide',
        width: 5120,
        height: 1440,
        channels: 3,
        data_type: 'uint8',
      }

      const dims = getImageDimensions(ultrawide)

      expect(dims.aspect_ratio).toBeCloseTo(5120 / 1440, 2)
    })

    it('should handle very small images', () => {
      const tinyImage: ImageInfo = {
        id: 'tiny',
        width: 1,
        height: 1,
        channels: 1,
        data_type: 'uint8',
      }

      const props = getImageProperties(tinyImage)

      expect(props.total_pixels).toBe(1)
    })
  })
})
