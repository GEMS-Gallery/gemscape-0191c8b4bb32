import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, CircularProgress, Snackbar, Typography } from '@mui/material';
import { backend } from 'declarations/backend';

type Shape = {
  id: bigint;
  shapeType: string;
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number;
  endY?: number;
};

type EndpointType = 'start' | 'end' | null;

const App: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShape, setSelectedShape] = useState<string>('circle');
  const [tempShape, setTempShape] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMovingEndpoint, setIsMovingEndpoint] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState<{ id: bigint; type: EndpointType }>({ id: BigInt(-1), type: null });
  const [hoveredEndpoint, setHoveredEndpoint] = useState<{ id: bigint; type: EndpointType } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [originalPosition, setOriginalPosition] = useState<{x: number, y: number} | null>(null);
  const [resizeStartSize, setResizeStartSize] = useState(0);
  const [fixedEndpoint, setFixedEndpoint] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    fetchShapes();
  }, []);

  const fetchShapes = async () => {
    try {
      const canvasShapes = await backend.getCanvas();
      setShapes(canvasShapes.map(shape => ({
        ...shape,
        id: BigInt(shape.id),
        x: Number(shape.x),
        y: Number(shape.y),
        size: Number(shape.size),
        endX: shape.endX ? Number(shape.endX) : undefined,
        endY: shape.endY ? Number(shape.endY) : undefined,
      })));
    } catch (error) {
      console.error('Error fetching shapes:', error);
      setError('Failed to fetch shapes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addShape = async (shape: Shape) => {
    setLoading(true);
    try {
      const result = await backend.addShape(
        shape.shapeType,
        shape.x,
        shape.y,
        shape.color,
        shape.size,
        shape.endX !== undefined ? [shape.endX] : [],
        shape.endY !== undefined ? [shape.endY] : []
      );
      if ('ok' in result) {
        const newShape = { ...shape, id: BigInt(result.ok) };
        setShapes(prevShapes => [...prevShapes, newShape]);
        return newShape;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error adding shape:', error);
      setError('Failed to add shape. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateShapeOptimistic = (updatedShape: Shape) => {
    setShapes(prevShapes => prevShapes.map(s => s.id === updatedShape.id ? updatedShape : s));
    updateShapeBackend(updatedShape);
  };

  const updateShapeBackend = async (shape: Shape) => {
    try {
      const result = await backend.updateShape(
        shape.id,
        shape.x,
        shape.y,
        shape.size,
        shape.endX !== undefined ? [shape.endX] : [],
        shape.endY !== undefined ? [shape.endY] : []
      );
      if ('err' in result) {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error updating shape:', error);
      setError('Failed to update shape. Please try again.');
      // Revert the change
      if (originalPosition) {
        setShapes(prevShapes => prevShapes.map(s => s.id === shape.id ? {...s, x: originalPosition.x, y: originalPosition.y, size: resizeStartSize} : s));
      }
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setStartX(x);
    setStartY(y);

    const clickedShape = shapes.find(shape => isPointInShape(x, y, shape));

    if (clickedShape) {
      setOriginalPosition({x: clickedShape.x, y: clickedShape.y});
      setResizeStartSize(clickedShape.size);
      if (isNearEdge(x, y, clickedShape)) {
        setIsResizing(true);
        setTempShape(clickedShape);
      } else {
        const endpoint = isNearEndpoint(x, y, clickedShape);
        if (endpoint) {
          setIsMovingEndpoint(true);
          setActiveEndpoint({ id: clickedShape.id, type: endpoint });
          setTempShape(clickedShape);
          if (endpoint === 'start') {
            setFixedEndpoint({x: clickedShape.endX!, y: clickedShape.endY!});
          } else {
            setFixedEndpoint({x: clickedShape.x, y: clickedShape.y});
          }
        } else {
          setIsMoving(true);
          setTempShape(clickedShape);
        }
      }
    } else if (!isMovingEndpoint) {
      const newShape: Shape = {
        id: BigInt(0),
        shapeType: selectedShape,
        x,
        y,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        size: 50,
        endX: selectedShape === 'line' ? x + 100 : undefined,
        endY: selectedShape === 'line' ? y : undefined,
      };
      setTempShape(newShape);
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isDrawing && tempShape) {
      setTempShape({ ...tempShape, x, y });
    } else if (isMoving && tempShape) {
      const dx = x - startX;
      const dy = y - startY;
      setTempShape({ ...tempShape, x: tempShape.x + dx, y: tempShape.y + dy });
      setStartX(x);
      setStartY(y);
    } else if (isResizing && tempShape) {
      const dx = x - tempShape.x;
      const dy = y - tempShape.y;
      const newSize = Math.max(10, Math.sqrt(dx * dx + dy * dy) * 2);
      setTempShape({ ...tempShape, size: newSize });
    } else if (isMovingEndpoint && tempShape && tempShape.shapeType === 'line' && fixedEndpoint) {
      if (activeEndpoint.type === 'start') {
        setTempShape({ ...tempShape, x, y, endX: fixedEndpoint.x, endY: fixedEndpoint.y });
      } else if (activeEndpoint.type === 'end') {
        setTempShape({ ...tempShape, x: fixedEndpoint.x, y: fixedEndpoint.y, endX: x, endY: y });
      }
    } else {
      // Check for hovering over line endpoints
      let foundHoveredEndpoint = false;
      for (const shape of shapes) {
        if (shape.shapeType === 'line') {
          const endpoint = isNearEndpoint(x, y, shape);
          if (endpoint) {
            setHoveredEndpoint({ id: shape.id, type: endpoint });
            foundHoveredEndpoint = true;
            break;
          }
        }
      }
      if (!foundHoveredEndpoint) {
        setHoveredEndpoint(null);
      }
    }
  };

  const handleMouseUp = async (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (tempShape) {
      if (isDrawing && tempShape.id === BigInt(0)) {
        const newShape = await addShape(tempShape);
        if (newShape) {
          setShapes(prevShapes => [...prevShapes, newShape]);
        }
      } else {
        updateShapeOptimistic(tempShape);
      }
    }
    setIsDrawing(false);
    setIsMoving(false);
    setIsResizing(false);
    setIsMovingEndpoint(false);
    setActiveEndpoint({ id: BigInt(-1), type: null });
    setTempShape(null);
    setOriginalPosition(null);
    setResizeStartSize(0);
    setFixedEndpoint(null);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if ((isMoving || isResizing || isMovingEndpoint) && tempShape && originalPosition) {
      setShapes(prevShapes => prevShapes.map(s => s.id === tempShape.id ? {...s, x: originalPosition.x, y: originalPosition.y, size: resizeStartSize} : s));
    }
    setIsDrawing(false);
    setIsMoving(false);
    setIsResizing(false);
    setIsMovingEndpoint(false);
    setActiveEndpoint({ id: BigInt(-1), type: null });
    setTempShape(null);
    setOriginalPosition(null);
    setResizeStartSize(0);
    setFixedEndpoint(null);
    setHoveredEndpoint(null);
  };

  const isPointInShape = (x: number, y: number, shape: Shape): boolean => {
    if (shape.shapeType === 'circle') {
      const dx = x - shape.x;
      const dy = y - shape.y;
      return dx * dx + dy * dy <= (shape.size / 2) * (shape.size / 2);
    } else if (shape.shapeType === 'square') {
      return x >= shape.x - shape.size / 2 &&
             x <= shape.x + shape.size / 2 &&
             y >= shape.y - shape.size / 2 &&
             y <= shape.y + shape.size / 2;
    } else if (shape.shapeType === 'triangle') {
      const halfSize = shape.size / 2;
      const h = Math.sqrt(3) / 2 * shape.size;
      const x1 = shape.x, y1 = shape.y - halfSize;
      const x2 = shape.x - halfSize, y2 = shape.y + h / 2;
      const x3 = shape.x + halfSize, y3 = shape.y + h / 2;
      const area = Math.abs((x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2)) / 2);
      const area1 = Math.abs((x*(y2-y3) + x2*(y3-y) + x3*(y-y2)) / 2);
      const area2 = Math.abs((x1*(y-y3) + x*(y3-y1) + x3*(y1-y)) / 2);
      const area3 = Math.abs((x1*(y2-y) + x2*(y-y1) + x*(y1-y2)) / 2);
      return Math.abs(area - (area1 + area2 + area3)) < 0.1;
    } else if (shape.shapeType === 'line' && shape.endX !== undefined && shape.endY !== undefined) {
      const lineLength = Math.sqrt(Math.pow(shape.endX - shape.x, 2) + Math.pow(shape.endY - shape.y, 2));
      const d1 = Math.sqrt(Math.pow(x - shape.x, 2) + Math.pow(y - shape.y, 2));
      const d2 = Math.sqrt(Math.pow(x - shape.endX, 2) + Math.pow(y - shape.endY, 2));
      return Math.abs(d1 + d2 - lineLength) < 5;
    }
    return false;
  };

  const isNearEdge = (x: number, y: number, shape: Shape): boolean => {
    if (shape.shapeType === 'circle' || shape.shapeType === 'square' || shape.shapeType === 'triangle') {
      const dx = x - shape.x;
      const dy = y - shape.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return Math.abs(distance - shape.size / 2) < 10;
    }
    return false;
  };

  const isNearEndpoint = (x: number, y: number, shape: Shape): EndpointType => {
    if (shape.shapeType === 'line' && shape.endX !== undefined && shape.endY !== undefined) {
      const d1 = Math.sqrt(Math.pow(x - shape.x, 2) + Math.pow(y - shape.y, 2));
      const d2 = Math.sqrt(Math.pow(x - shape.endX, 2) + Math.pow(y - shape.endY, 2));
      if (d1 < 10) return 'start';
      if (d2 < 10) return 'end';
    }
    return null;
  };

  const renderShape = (shape: Shape) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: shape.color,
      pointerEvents: 'none',
      cursor: 'pointer',
    };

    switch (shape.shapeType) {
      case 'circle':
        style.width = `${shape.size}px`;
        style.height = `${shape.size}px`;
        style.borderRadius = '50%';
        style.left = `${shape.x}px`;
        style.top = `${shape.y}px`;
        style.transform = 'translate(-50%, -50%)';
        break;
      case 'square':
        style.width = `${shape.size}px`;
        style.height = `${shape.size}px`;
        style.left = `${shape.x}px`;
        style.top = `${shape.y}px`;
        style.transform = 'translate(-50%, -50%)';
        break;
      case 'triangle':
        const halfSize = shape.size / 2;
        const h = Math.sqrt(3) / 2 * shape.size;
        style.width = '0';
        style.height = '0';
        style.borderLeft = `${halfSize}px solid transparent`;
        style.borderRight = `${halfSize}px solid transparent`;
        style.borderBottom = `${h}px solid ${shape.color}`;
        style.backgroundColor = 'transparent';
        style.left = `${shape.x}px`;
        style.top = `${shape.y - h / 2}px`;
        break;
      case 'line':
        if (shape.endX !== undefined && shape.endY !== undefined) {
          const dx = shape.endX - shape.x;
          const dy = shape.endY - shape.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          style.width = `${length}px`;
          style.height = '2px';
          style.left = `${shape.x}px`;
          style.top = `${shape.y}px`;
          style.transform = `rotate(${angle}deg)`;
          style.transformOrigin = 'left center';
          return (
            <>
              <div key={shape.id.toString()} className="shape" style={style} />
              {((hoveredEndpoint?.id === shape.id && hoveredEndpoint?.type === 'start') || (activeEndpoint.id === shape.id && activeEndpoint.type === 'start')) && (
                <div className="line-endpoint" style={{ left: `${shape.x}px`, top: `${shape.y}px` }} />
              )}
              {((hoveredEndpoint?.id === shape.id && hoveredEndpoint?.type === 'end') || (activeEndpoint.id === shape.id && activeEndpoint.type === 'end')) && (
                <div className="line-endpoint" style={{ left: `${shape.endX}px`, top: `${shape.endY}px` }} />
              )}
            </>
          );
        }
        break;
      default:
        return null;
    }

    return (
      <div
        key={shape.id.toString()}
        className="shape"
        style={style}
        draggable="false"
      />
    );
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const result = await backend.clearCanvas();
      if ('ok' in result) {
        setShapes([]);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error clearing canvas:', error);
      setError('Failed to clear canvas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Typography className="app-title" variant="h4" component="h1">
        GemScape
      </Typography>
      <Box
        id="canvas-container"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        sx={{ width: '100%', height: '100%', position: 'relative' }}
      >
        {shapes.map(renderShape)}
        {tempShape && renderShape(tempShape)}
      </Box>
      <Box className="toolbar">
        <Button
          variant={selectedShape === 'circle' ? 'contained' : 'outlined'}
          onClick={() => setSelectedShape('circle')}
        >
          Circle
        </Button>
        <Button
          variant={selectedShape === 'square' ? 'contained' : 'outlined'}
          onClick={() => setSelectedShape('square')}
        >
          Square
        </Button>
        <Button
          variant={selectedShape === 'triangle' ? 'contained' : 'outlined'}
          onClick={() => setSelectedShape('triangle')}
        >
          Triangle
        </Button>
        <Button
          variant={selectedShape === 'line' ? 'contained' : 'outlined'}
          onClick={() => setSelectedShape('line')}
        >
          Line
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleReset}
        >
          Reset
        </Button>
      </Box>
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        message={error}
      />
    </Box>
  );
};

export default App;