import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { backend } from 'declarations/backend';

type Shape = {
  id: bigint;
  shapeType: string;
  x: number;
  y: number;
  color: string;
};

const App: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShape, setSelectedShape] = useState<string>('circle');

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
        y: Number(shape.y)
      })));
    } catch (error) {
      console.error('Error fetching shapes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addShape = async (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const color = `#${Math.floor(Math.random()*16777215).toString(16)}`;

    setLoading(true);
    try {
      const id = await backend.addShape(selectedShape, x, y, color);
      setShapes([...shapes, { id: BigInt(id), shapeType: selectedShape, x, y, color }]);
    } catch (error) {
      console.error('Error adding shape:', error);
    } finally {
      setLoading(false);
    }
  };

  const moveShape = async (id: bigint, newX: number, newY: number) => {
    setLoading(true);
    try {
      await backend.moveShape(id, newX, newY);
      setShapes(shapes.map(shape =>
        shape.id === id ? { ...shape, x: newX, y: newY } : shape
      ));
    } catch (error) {
      console.error('Error moving shape:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderShape = (shape: Shape) => {
    const style: React.CSSProperties = {
      left: `${shape.x}px`,
      top: `${shape.y}px`,
      backgroundColor: shape.color,
    };

    switch (shape.shapeType) {
      case 'circle':
        style.width = '50px';
        style.height = '50px';
        style.borderRadius = '50%';
        break;
      case 'square':
        style.width = '50px';
        style.height = '50px';
        break;
      case 'line':
        style.width = '100px';
        style.height = '2px';
        break;
      default:
        return null;
    }

    return (
      <div
        key={shape.id.toString()}
        className="shape"
        style={style}
        draggable
        onDragEnd={(e) => moveShape(shape.id, e.clientX, e.clientY)}
      />
    );
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Box
        id="canvas-container"
        onClick={addShape}
        sx={{ width: '100%', height: '100%', position: 'relative' }}
      >
        {shapes.map(renderShape)}
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
    </Box>
  );
};

export default App;