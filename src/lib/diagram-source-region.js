// Pixel coordinates in the original image. The source bytes remain unchanged.
export function validSourceRegion(region) {
  if (!region || !['x', 'y', 'width', 'height', 'sourceWidth', 'sourceHeight'].every(key => Number.isFinite(region[key]))) return false;
  return region.x >= 0 && region.y >= 0 && region.width > 0 && region.height > 0
    && region.x + region.width <= region.sourceWidth && region.y + region.height <= region.sourceHeight;
}

export function sourceRegionStyles(region) {
  if (!validSourceRegion(region)) return null;
  return {
    frame: `position:relative;overflow:hidden;aspect-ratio:${region.width}/${region.height}`,
    image: `position:absolute;max-width:none;width:${100 * region.sourceWidth / region.width}%;height:${100 * region.sourceHeight / region.height}%;left:${-100 * region.x / region.width}%;top:${-100 * region.y / region.height}%;`,
  };
}
