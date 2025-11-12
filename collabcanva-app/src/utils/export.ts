import type Konva from 'konva';

/**
 * Export the canvas as PNG
 */
export function exportAsPNG(stage: Konva.Stage, filename: string = 'canvas-export.png'): void {
  try {
    const uri = stage.toDataURL({ pixelRatio: 2 }); // 2x for better quality
    downloadURI(uri, filename);
  } catch (error) {
    console.error('Failed to export as PNG:', error);
    alert('Failed to export canvas. Please try again.');
  }
}

/**
 * Export the canvas as SVG
 * Note: Konva doesn't have built-in SVG export, so we'll export as high-quality PNG
 * In a production app, you'd need a library like konva-to-svg
 */
export function exportAsSVG(stage: Konva.Stage, filename: string = 'canvas-export.svg'): void {
  // For now, export as high-quality PNG
  // In production, use a library like konva-to-svg for true SVG export
  try {
    const uri = stage.toDataURL({ pixelRatio: 3 }); // 3x for very high quality
    const pngFilename = filename.replace('.svg', '.png');
    downloadURI(uri, pngFilename);
    alert('Note: Exported as high-quality PNG. For true SVG export, a specialized library would be needed.');
  } catch (error) {
    console.error('Failed to export as SVG:', error);
    alert('Failed to export canvas. Please try again.');
  }
}

/**
 * Export selected shapes only
 */
export function exportSelection(stage: Konva.Stage, selectedId: string | null, filename: string = 'selection-export.png'): void {
  if (!selectedId) {
    alert('Please select a shape to export.');
    return;
  }

  try {
    const layers = stage.getLayers();
    if (layers.length === 0) return;
    
    const layer = layers[0];
    const shape = layer.findOne(`#${selectedId}`) as Konva.Node;
    if (!shape) return;

    // Get shape bounds
    const bounds = shape.getClientRect();
    
    // Export just the selected area
    const uri = stage.toDataURL({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      pixelRatio: 2,
    });
    
    downloadURI(uri, filename);
  } catch (error) {
    console.error('Failed to export selection:', error);
    alert('Failed to export selection. Please try again.');
  }
}

/**
 * Helper function to download data URI as file
 */
function downloadURI(uri: string, name: string): void {
  const link = document.createElement('a');
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

