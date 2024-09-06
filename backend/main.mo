import Array "mo:base/Array";
import Float "mo:base/Float";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";

actor {
  type Shape = {
    id: Nat;
    shapeType: Text;
    x: Float;
    y: Float;
    color: Text;
    size: Float;
    endX: ?Float;
    endY: ?Float;
  };

  stable var nextShapeId: Nat = 0;
  stable var shapes: [Shape] = [];

  public func addShape(shapeType: Text, x: Float, y: Float, color: Text, size: Float, endX: ?Float, endY: ?Float): async Result.Result<Nat, Text> {
    let newShape: Shape = {
      id = nextShapeId;
      shapeType = shapeType;
      x = x;
      y = y;
      color = color;
      size = size;
      endX = endX;
      endY = endY;
    };
    nextShapeId += 1;
    shapes := Array.append(shapes, [newShape]);
    Debug.print("Shape added: " # debug_show(newShape));
    #ok(newShape.id)
  };

  public func updateShape(id: Nat, x: Float, y: Float, size: Float, endX: ?Float, endY: ?Float): async Result.Result<(), Text> {
    let index = Array.indexOf<Shape>({ id = id; shapeType = ""; x = 0; y = 0; color = ""; size = 0; endX = null; endY = null }, shapes, func(a, b) { a.id == b.id });
    switch (index) {
      case null { #err("Shape not found") };
      case (?i) {
        let updatedShape = {
          shapes[i] with
          x = x;
          y = y;
          size = size;
          endX = endX;
          endY = endY;
        };
        shapes := Array.tabulate<Shape>(shapes.size(), func (j) {
          if (j == i) { updatedShape } else { shapes[j] }
        });
        Debug.print("Shape updated: " # debug_show(updatedShape));
        #ok()
      };
    }
  };

  public func deleteShape(id: Nat): async Result.Result<(), Text> {
    let newShapes = Array.filter<Shape>(shapes, func(shape) { shape.id != id });
    if (newShapes.size() < shapes.size()) {
      shapes := newShapes;
      Debug.print("Shape deleted: " # Nat.toText(id));
      #ok()
    } else {
      #err("Shape not found")
    }
  };

  public query func getCanvas(): async [Shape] {
    shapes
  };

  public func updateCanvas(newShapes: [Shape]): async Result.Result<(), Text> {
    shapes := newShapes;
    Debug.print("Canvas updated with " # Nat.toText(newShapes.size()) # " shapes");
    #ok()
  };
}