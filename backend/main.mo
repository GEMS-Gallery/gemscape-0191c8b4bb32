import Bool "mo:base/Bool";

import Array "mo:base/Array";
import Float "mo:base/Float";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";

actor {
  type Shape = {
    id: Nat;
    shapeType: Text;
    x: Float;
    y: Float;
    color: Text;
  };

  stable var nextShapeId: Nat = 0;
  stable var shapes: [Shape] = [];

  public func addShape(shapeType: Text, x: Float, y: Float, color: Text): async Nat {
    let newShape: Shape = {
      id = nextShapeId;
      shapeType = shapeType;
      x = x;
      y = y;
      color = color;
    };
    nextShapeId += 1;
    shapes := Array.append(shapes, [newShape]);
    newShape.id
  };

  public func moveShape(id: Nat, x: Float, y: Float): async Bool {
    let index = Array.indexOf<Shape>({ id = id; shapeType = ""; x = 0; y = 0; color = "" }, shapes, func(a, b) { a.id == b.id });
    switch (index) {
      case null { false };
      case (?i) {
        let updatedShape = { shapes[i] with x = x; y = y };
        shapes := Array.tabulate<Shape>(shapes.size(), func (j) {
          if (j == i) { updatedShape } else { shapes[j] }
        });
        true
      };
    }
  };

  public func deleteShape(id: Nat): async Bool {
    let newShapes = Array.filter<Shape>(shapes, func(shape) { shape.id != id });
    if (newShapes.size() < shapes.size()) {
      shapes := newShapes;
      true
    } else {
      false
    }
  };

  public query func getCanvas(): async [Shape] {
    shapes
  };

  public func updateCanvas(newShapes: [Shape]): async Bool {
    shapes := newShapes;
    true
  };
}