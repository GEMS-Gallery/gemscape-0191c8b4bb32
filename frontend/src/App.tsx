import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, CircularProgress, Snackbar } from '@mui/material';
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

const App: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShape, setSelectedShape] = useState<string>('circle');
  const [tempShape, setTempShape] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMovingEndpoint, setIsMovingEndpoint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

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
        shape.endX,
        shape.endY
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

  const updateShape = async (shape: Shape) => {
    setLoading(true);
    try {
      const result = await backend.updateShape(
        shape.id,
        shape.x,
        shape.y,
        shape.size,
        shape.endX,
        shape.endY
      );
      if ('ok' in result) {
        setShapes(prevShapes => prevShapes.map(s => s.id === shape.id ? shape : s));
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error updating shape:', error);
      setError('Failed to update shape. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedShape = shapes.find(shape => isPointInShape(x, y, shape));

    if (clickedShape) {
      if (isNearEdge(x, y, clickedShape)) {
        setIsResizing(true);
      } else if (isNearEndpoint(x, y, clickedShape)) {
        setIsMovingEndpoint(true);
      } else {
        setIsDrawing(true);
      }
      setTempShape(clickedShape);
    } else {
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
    if (!canvasRef.current || !tempShape) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isDrawing) {
      setTempShape({ ...tempShape, x, y });
    } else if (isResizing) {
      const dx = x - tempShape.x;
      const dy = y - tempShape.y;
      const newSize = Math.sqrt(dx * dx + dy * dy) * 2;
      setTempShape({ ...tempShape, size: newSize });
    } else if (isMovingEndpoint && tempShape.shapeType === 'line') {
      setTempShape({ ...tempShape, endX: x, endY: y });
    }
  };

  const handleMouseUp = async () => {
    if (tempShape) {
      if (isDrawing && tempShape.id === BigInt(0)) {
        const newShape = await addShape(tempShape);
        if (newShape) {
          setShapes(prevShapes => [...prevShapes, newShape]);
        }
      } else {
        await updateShape(tempShape);
      }
    }
    setIsDrawing(false);
    setIsResizing(false);
    setIsMovingEndpoint(false);
    setTempShape(null);
  };

  const isPointInShape = (x: number, y: number, shape: Shape): boolean => {
    if (shape.shapeType === 'circle' || shape.shapeType === 'square') {
      const dx = x - shape.x;
      const dy = y - shape.y;
      return dx * dx + dy * dy <= (shape.size / 2) * (shape.size / 2);
    } else if (shape.shapeType === 'line' && shape.endX !== undefined && shape.endY !== undefined) {
      const lineLength = Math.sqrt(Math.pow(shape.endX - shape.x, 2) + Math.pow(shape.endY - shape.y, 2));
      const d1 = Math.sqrt(Math.pow(x - shape.x, 2) + Math.pow(y - shape.y, 2));
      const d2 = Math.sqrt(Math.pow(x - shape.endX, 2) + Math.pow(y - shape.endY, 2));
      return Math.abs(d1 + d2 - lineLength) < 1;
    }
    return false;
  };

  const isNearEdge = (x: number, y: number, shape: Shape): boolean => {
    if (shape.shapeType === 'circle' || shape.shapeType === 'square') {
      const dx = x - shape.x;
      const dy = y - shape.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return Math.abs(distance - shape.size / 2) < 10;
    }
    return false;
  };

  const isNearEndpoint = (x: number, y: number, shape: Shape): boolean => {
    if (shape.shapeType === 'line' && shape.endX !== undefined && shape.endY !== undefined) {
      const d1 = Math.sqrt(Math.pow(x - shape.x, 2) + Math.pow(y - shape.y, 2));
      const d2 = Math.sqrt(Math.pow(x - shape.endX, 2) + Math.pow(y - shape.endY, 2));
      return d1 < 10 || d2 < 10;
    }
    return false;
  };

  const renderShape = (shape: Shape) => {
    const style: React.CSSProperties = {
      left: `${shape.x}px`,
      top: `${shape.y}px`,
      backgroundColor: shape.color,
    };

    switch (shape.shapeType) {
      case 'circle':
        style.width = `${shape.size}px`;
        style.height = `${shape.size}px`;
        style.borderRadius = '50%';
        break;
      case 'square':
        style.width = `${shape.size}px`;
        style.height = `${shape.size}px`;
        break;
      case 'line':
        if (shape.endX !== undefined && shape.endY !== undefined) {
          const dx = shape.endX - shape.x;
          const dy = shape.endY - shape.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          style.width = `${length}px`;
          style.height = '2px';
          style.transform = `rotate(${angle}deg)`;
          style.transformOrigin = 'left center';
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
      />
    );
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Box
        id="canvas-container"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
          variant={selectedShape === 'line' ? 'contained' : 'outlined'}
          onClick={() => setSelectedShape('line')}
        >
          Line
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