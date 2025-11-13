// OpenCV Core - Computer vision foundation
// TypeScript bindings for the napi-rs module

export interface ImageInfo {
  id: string
  width: number
  height: number
  channels: number
  data_type: string
  metadata?: Record<string, any>
}

export interface ColorSpaceInfo {
  name: string
  channels: number
  description: string
}

export interface ImageOptions {
  width?: number
  height?: number
  channels?: number
  data_type?: string
}

export interface ImageProperties {
  id: string
  width: number
  height: number
  channels: number
  data_type: string
  total_pixels: number
  total_elements: number
  estimated_bytes: number
  aspect_ratio: number
}

export interface ImageDimensions {
  width: number
  height: number
  channels: number
  aspect_ratio: number
  total_pixels: number
  dpi: number
}

/**
 * Native bindings from opencv_core Rust module
 */
let opencvCore: any

try {
  // Load the native module via platform loader
  opencvCore = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native opencv_core module not loaded. Build the project first.')
  opencvCore = null
}

/**
 * Create an image/matrix from image metadata
 * @param image - Image metadata (width, height, channels, etc.)
 * @returns Created image info
 */
export function createImage(image: ImageInfo): ImageInfo {
  if (!opencvCore) {
    throw new Error('Native module not available')
  }

  const imageJson = JSON.stringify(image)
  const result = opencvCore.createImage(imageJson)

  return JSON.parse(result)
}

/**
 * Get image/matrix properties
 * @param image - Image object
 * @returns Image properties
 */
export function getImageProperties(image: ImageInfo): ImageProperties {
  if (!opencvCore) {
    throw new Error('Native module not available')
  }

  const imageJson = JSON.stringify(image)
  const result = opencvCore.getImageProperties(imageJson)

  return JSON.parse(result)
}

/**
 * Convert between color spaces
 * @param image - Image object
 * @param sourceColorSpace - Source color space
 * @param targetColorSpace - Target color space
 * @returns Converted image info
 */
export function convertColorSpace(
  image: ImageInfo,
  sourceColorSpace: string,
  targetColorSpace: string
): ImageInfo {
  if (!opencvCore) {
    throw new Error('Native module not available')
  }

  const imageJson = JSON.stringify(image)
  const result = opencvCore.convertColorSpace(imageJson, sourceColorSpace, targetColorSpace)

  return JSON.parse(result)
}

/**
 * Get information about a color space
 * @param colorSpace - Name of the color space
 * @returns Color space information
 */
export function getColorSpaceInfo(colorSpace: string): ColorSpaceInfo {
  if (!opencvCore) {
    throw new Error('Native module not available')
  }

  const result = opencvCore.getColorSpaceInfo(colorSpace)

  return JSON.parse(result)
}

/**
 * Resize image
 * @param image - Image object
 * @param newWidth - New width in pixels
 * @param newHeight - New height in pixels
 * @returns Resized image info
 */
export function resizeImage(image: ImageInfo, newWidth: number, newHeight: number): ImageInfo {
  if (!opencvCore) {
    throw new Error('Native module not available')
  }

  const imageJson = JSON.stringify(image)
  const result = opencvCore.resizeImage(imageJson, newWidth, newHeight)

  return JSON.parse(result)
}

/**
 * Get image dimensions
 * @param image - Image object
 * @returns Image dimensions
 */
export function getImageDimensions(image: ImageInfo): ImageDimensions {
  if (!opencvCore) {
    throw new Error('Native module not available')
  }

  const imageJson = JSON.stringify(image)
  const result = opencvCore.getImageDimensions(imageJson)

  return JSON.parse(result)
}

/**
 * Batch process multiple images
 * @param images - Array of image objects
 * @returns Array of processed image info
 */
export function batchProcessImages(images: ImageInfo[]): ImageInfo[] {
  if (!opencvCore) {
    throw new Error('Native module not available')
  }

  const imagesJson = JSON.stringify(images)
  const result = opencvCore.batchProcessImages(imagesJson)

  return JSON.parse(result)
}

/**
 * Get supported color spaces
 * @returns Array of supported color spaces
 */
export function getSupportedColorSpaces(): ColorSpaceInfo[] {
  if (!opencvCore) {
    throw new Error('Native module not available')
  }

  const result = opencvCore.getSupportedColorSpaces()

  return JSON.parse(result)
}

/**
 * Get image statistics
 * @param image - Image object
 * @returns Image statistics
 */
export function getImageStatistics(image: ImageInfo): Record<string, any> {
  if (!opencvCore) {
    throw new Error('Native module not available')
  }

  const imageJson = JSON.stringify(image)
  const result = opencvCore.getImageStatistics(imageJson)

  return JSON.parse(result)
}

/**
 * OpenCVCore class for object-oriented API
 */
export class OpenCVCore {
  /**
   * Create a new OpenCVCore instance
   */
  constructor() {
    if (!opencvCore) {
      throw new Error('Native module not available')
    }
  }

  /**
   * Create an image
   */
  createImage(image: ImageInfo): ImageInfo {
    return createImage(image)
  }

  /**
   * Get image properties
   */
  getProperties(image: ImageInfo): ImageProperties {
    return getImageProperties(image)
  }

  /**
   * Convert color space
   */
  convertColor(
    image: ImageInfo,
    sourceColorSpace: string,
    targetColorSpace: string
  ): ImageInfo {
    return convertColorSpace(image, sourceColorSpace, targetColorSpace)
  }

  /**
   * Get color space information
   */
  getColorSpaceInfo(colorSpace: string): ColorSpaceInfo {
    return getColorSpaceInfo(colorSpace)
  }

  /**
   * Resize an image
   */
  resize(image: ImageInfo, newWidth: number, newHeight: number): ImageInfo {
    return resizeImage(image, newWidth, newHeight)
  }

  /**
   * Get image dimensions
   */
  getDimensions(image: ImageInfo): ImageDimensions {
    return getImageDimensions(image)
  }

  /**
   * Batch process images
   */
  batchProcess(images: ImageInfo[]): ImageInfo[] {
    return batchProcessImages(images)
  }

  /**
   * Get supported color spaces
   */
  getSupportedColorSpaces(): ColorSpaceInfo[] {
    return getSupportedColorSpaces()
  }

  /**
   * Get image statistics
   */
  getStatistics(image: ImageInfo): Record<string, any> {
    return getImageStatistics(image)
  }
}

// Export all types and functions
export default {
  createImage,
  getImageProperties,
  convertColorSpace,
  getColorSpaceInfo,
  resizeImage,
  getImageDimensions,
  batchProcessImages,
  getSupportedColorSpaces,
  getImageStatistics,
  OpenCVCore,
}
